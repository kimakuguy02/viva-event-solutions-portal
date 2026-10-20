import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDb, saveDb, appendAuditLog, verifyPassword, hashPassword } from './db';

import dotenv from 'dotenv';
dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("Configuration de sécurité serveur invalide : SESSION_SECRET manquant ou insuffisant (min 32 caractères requis). Le serveur refuse de démarrer avec une sécurité compromise.");
}
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours session

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  directionName?: string;
  phone?: string;
  permissions: string[];
}

export interface SessionTokenPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  expiresAt: number;
}

// Generate signed bearer token
export function createSessionToken(user: AuthenticatedUser): { token: string; expiresAt: number } {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  const payload: SessionTokenPayload = {
    sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    expiresAt
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('base64url');
  const token = `${payloadBase64}.${signature}`;

  // Persist session to database
  const db = getDb();
  db.sessions.push({
    token,
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt
  });
  saveDb(db);

  return { token, expiresAt };
}

// Verify token and return user payload
export function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('base64url');
  const signatureBytes = Buffer.from(signature);
  const expectedSignatureBytes = Buffer.from(expectedSig);

  if (
    signatureBytes.length !== expectedSignatureBytes.length ||
    !crypto.timingSafeEqual(signatureBytes, expectedSignatureBytes)
  ) {
    return null;
  }

  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  if (
    typeof payload.userId !== 'string' ||
    typeof payload.expiresAt !== 'number' ||
    !Number.isFinite(payload.expiresAt) ||
    Date.now() >= payload.expiresAt
  ) {
    return null;
  }

  const db = getDb();
  const sessionExists = db.sessions.some(session =>
    session.token === token &&
    session.userId === payload.userId &&
    session.expiresAt === payload.expiresAt
  );
  if (!sessionExists) return null;

  const user = db.users.find(candidate => candidate.id === payload.userId);
  if (!user || user.status === 'suspended' || typeof user.role !== 'string') {
    return null;
  }

  return {
    ...payload,
    email: user.email,
    role: user.role,
    permissions: Array.isArray(user.permissions)
      ? user.permissions.filter((permission: unknown): permission is string => typeof permission === 'string')
      : [],
  };
}

// Rate limiting state
interface RateAttempt {
  count: number;
  lockedUntil: number;
}
const authAttempts = new Map<string, RateAttempt>();

export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = authAttempts.get(ip) || { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const waitMins = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Trop de tentatives. Accès sécurisé bloqué pendant encore ${waitMins} minute(s).`
    });
  }

  next();
};

export function recordFailedAuth(ip: string): { count: number; locked: boolean } {
  const now = Date.now();
  const record = authAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= 3) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 mins lock
    authAttempts.set(ip, record);
    return { count: record.count, locked: true };
  }

  authAttempts.set(ip, record);
  return { count: record.count, locked: false };
}

export function recordSuccessAuth(ip: string): void {
  authAttempts.delete(ip);
}

// Extend Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: SessionTokenPayload;
    }
  }
}

// Middleware: Require valid session token
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Session non authentifiée. Jeton Bearer requis." });
  }

  const token = authHeader.substring(7);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
  }

  req.user = session;
  next();
};

// Middleware: Require specific role or God Mode (admin_general)
export const requireRole = (allowedRoles: string | string[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    // God Mode bypass for Super Admin
    if (req.user.role === 'admin_general') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      appendAuditLog({
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED_ROLE_MISMATCH',
        resource: req.path,
        result: 'denied',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `Rôle requis : ${roles.join(', ')}. Rôle détenu : ${req.user.role}`
      });
      return res.status(403).json({ error: "Accès refusé. Privilèges de rôle insuffisants." });
    }

    next();
  };
};

// Middleware: Require specific granular permission (e.g. 'users.create', 'quotes.manage')
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    // God Mode has all permissions
    if (req.user.role === 'admin_general' || req.user.permissions.includes('all_access') || req.user.permissions.includes('god_mode')) {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      appendAuditLog({
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED_PERMISSION_MISSING',
        resource: req.path,
        result: 'denied',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `Permission requise : ${permission}`
      });
      return res.status(403).json({ error: `Action interdite. Permission requise : ${permission}` });
    }

    next();
  };
};
