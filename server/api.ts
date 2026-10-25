import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb, saveDb, appendAuditLog, hashPassword, verifyPassword } from './db';
import {
  requireAuth,
  requireRole,
  requirePermission,
  authRateLimiter,
  recordFailedAuth,
  recordSuccessAuth,
  createSessionToken,
  AuthenticatedUser
} from './auth';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================

router.post('/auth/login', authRateLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.status === 'suspended') {
    const { count, locked } = recordFailedAuth(ip);
    appendAuditLog({
      userEmail: email,
      action: 'LOGIN_FAILED_UNKNOWN_USER',
      resource: 'auth',
      result: 'failure',
      ipAddress: ip,
      userAgent,
      details: locked ? 'IP temporairement verrouillée suite à 3 échecs.' : `Tentative ${count}/3`
    });

    if (locked) {
      return res.status(429).json({ error: "3 tentatives erronées. Compte temporairement verrouillé pendant 15 minutes." });
    }
    return res.status(401).json({ error: `Identifiants incorrects (${count}/3 tentatives).` });
  }

  // Verify password using PBKDF2 hash
  const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);

  if (!isValid) {
    const { count, locked } = recordFailedAuth(ip);
    appendAuditLog({
      userId: user.id,
      userEmail: email,
      action: 'LOGIN_FAILED_INVALID_PASSWORD',
      resource: 'auth',
      result: 'failure',
      ipAddress: ip,
      userAgent,
      details: locked ? 'IP temporairement verrouillée.' : `Tentative ${count}/3`
    });

    if (locked) {
      return res.status(429).json({ error: "3 tentatives erronées. Compte temporairement verrouillé pendant 15 minutes." });
    }
    return res.status(401).json({ error: `Identifiants incorrects (${count}/3 tentatives).` });
  }

  // Success
  recordSuccessAuth(ip);
  user.lastLogin = new Date().toISOString();
  saveDb(db);

  const authUser: AuthenticatedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    directionName: user.directionName,
    phone: user.phone,
    permissions: user.permissions || []
  };

  const { token, expiresAt } = createSessionToken(authUser);

  appendAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'LOGIN_SUCCESS',
    resource: 'auth',
    result: 'success',
    ipAddress: ip,
    userAgent,
    details: `Session initialisée pour le rôle : ${user.role}`
  });

  res.json({
    success: true,
    token,
    expiresAt,
    user: authUser
  });
});

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user!.userId);

  if (!user || user.status === 'suspended') {
    return res.status(401).json({ error: "Compte introuvable ou suspendu." });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      directionName: user.directionName,
      phone: user.phone,
      permissions: user.permissions || []
    }
  });
});

router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const token = req.headers.authorization!.slice(7);
  db.sessions = db.sessions.filter(session => session.token !== token);
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'LOGOUT',
    resource: 'auth',
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({ success: true, message: "Déconnexion réussie." });
});

router.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au moins 8 caractères." });
  }

  const db = getDb();
  const user = db.users.find(u => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const isCurrentValid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
  if (!isCurrentValid) {
    return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.passwordSalt = salt;
  saveDb(db);

  appendAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'PASSWORD_CHANGED',
    resource: 'users',
    resourceId: user.id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({ success: true, message: "Mot de passe mis à jour avec succès." });
});

// ==========================================
// 2. BIDIRECTIONAL SYNCHRONIZATION (OFFLINE QUEUE -> SERVER)
// ==========================================

router.get('/sync/pull', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user!.userId);
  if (!user || user.status === 'suspended') {
    return res.status(403).json({ error: "Accès refusé. Compte inactif ou suspendu." });
  }

  const permissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];
  const hasPermission = (permission: string) => permissions.includes(permission);
  const isSuperAdmin =
    user.role === 'admin_general' ||
    user.role === 'admin' ||
    user.role === 'dg_gerant' ||
    hasPermission('all_access') ||
    hasPermission('god_mode');
  const hasFinance = isSuperAdmin || user.role === 'daf_comptable' || hasPermission('finance.approve');
  const hasQuotes = isSuperAdmin || hasPermission('quotes.manage');
  const hasEquipment = isSuperAdmin || hasPermission('equipment.manage');
  const hasHr = isSuperAdmin || user.role === 'admin_rh' || hasPermission('users.view');

  // Rôles autorisés par module : source src/utils/rbac.ts (ERP_RBAC_PERMISSIONS).
  const PROJECTS_ROLES = new Set(['dg_gerant', 'admin_rh', 'chef_equipe', 'admin', 'admin_general']);
  const CRM_ROLES = new Set(['dg_gerant', 'admin_rh', 'commercial_secretaire', 'daf_comptable', 'admin', 'admin_general']);
  const ASSETS_ROLES = new Set(['dg_gerant', 'admin_rh', 'chef_equipe', 'admin', 'admin_general']);
  const canSeeProjects = isSuperAdmin || PROJECTS_ROLES.has(user.role);
  const canSeeCrm = isSuperAdmin || CRM_ROLES.has(user.role);
  const canSeeAssets = isSuperAdmin || ASSETS_ROLES.has(user.role);

  const directionNumber = Number.parseInt(String(user.directionName ?? '').slice(0, 2), 10);
  const hasDirection = Number.isInteger(directionNumber) && directionNumber > 0;

  // Périmètre projet : uniquement un lien explicite (clientId pour un client,
  // pôles mobilisés pour un employé). Aucune autre correspondance n'est supposée.
  const visibleProjects = db.projects.filter((project: any) => {
    if (isSuperAdmin) return true;
    if (user.role === 'client') return typeof project.clientId === 'string' && project.clientId === user.id;
    if (!canSeeProjects || !hasDirection) return false;
    return Array.isArray(project.departmentsAssigned)
      && project.departmentsAssigned.map(Number).includes(directionNumber);
  });

  const projectForUser = (project: any) => {
    if (hasFinance) return project;
    const { budgetUSD, ...rest } = project;
    void budgetUSD;
    return rest;
  };

  const visibleProjectCodes = new Set<string>(
    visibleProjects
      .map((project: any) => project.code)
      .filter((code: unknown): code is string => typeof code === 'string')
  );
  const scopeByProjectCode = (rows: any[]) =>
    isSuperAdmin ? rows : rows.filter(row => typeof row?.projectCode === 'string' && visibleProjectCodes.has(row.projectCode));

  // Allowlist : toute collection ERP non listée est exclue par défaut.
  const syncedErp = {
    employees: hasHr ? db.erp.employees : db.erp.employees.map((e: any) => ({ id: e.id, name: e.name, jobPosition: e.jobPosition })),
    crmClients: canSeeCrm ? db.erp.crmClients : [],
    crmInteractions: canSeeCrm ? db.erp.crmInteractions : [],
    transactions: hasFinance ? db.erp.transactions : [],
    cashClosures: hasFinance ? db.erp.cashClosures : [],
    tasks: scopeByProjectCode(db.erp.tasks),
    fieldReports: scopeByProjectCode(db.erp.fieldReports),
    loanRecords: canSeeAssets ? db.erp.loanRecords : [],
    maintenanceLogs: canSeeAssets ? db.erp.maintenanceLogs : [],
    notices: canSeeCrm ? db.erp.notices : []
  };

  res.json({
    serverTime: new Date().toISOString(),
    version: db.version,
    data: {
      platformConfig: db.platformConfig,
      directionsOrg: db.directionsOrg,
      dynamicMenus: db.dynamicMenus,
      dynamicModules: db.dynamicModules,
      cmsSections: db.cmsSections,
      projects: visibleProjects.map(projectForUser),
      quotes: hasQuotes ? db.quotes : [],
      equipment: hasEquipment ? db.equipment : db.equipment.map((e: any) => ({ id: e.id, name: e.name, category: e.category, status: e.status })),
      // Aucun rôle ni permission ne régit les partenaires : moindre privilège.
      partners: isSuperAdmin ? db.partners : [],
      featureFlags: db.featureFlags,
      financialSettings: hasFinance ? db.financialSettings : { exchangeRateCDF: db.financialSettings.exchangeRateCDF, vatRatePercent: db.financialSettings.vatRatePercent },
      erp: syncedErp
    }
  });
});

router.post('/sync/push', requireAuth, (req: Request, res: Response) => {
  const { mutations } = req.body;
  if (!Array.isArray(mutations)) {
    return res.status(400).json({ error: "Le payload doit contenir un tableau 'mutations'." });
  }
  // Garde anti-abus : volume borné (SEC-04, Phase 1).
  if (mutations.length > 100) {
    return res.status(413).json({ error: "Trop de mutations (max 100 par appel)." });
  }

  // Permission requise par entité — AUCUNE mutation sans droit explicite.
  // Correspond aux permissions des routes REST dédiées.
  const ENTITY_PERMISSIONS: Record<string, string> = {
    cmsSections: 'content.update',
    platformConfig: 'settings.update',
    directionsOrg: 'organization.update',
    dynamicMenus: 'settings.update',
    dynamicModules: 'modules.update',
    quotes: 'quotes.manage',
    erp_transactions: 'finance.approve',
  };
  const userCan = (perm: string): boolean => {
    const u = req.user!;
    return u.role === 'admin_general' || u.permissions.includes('all_access') || u.permissions.includes('god_mode') || u.permissions.includes(perm);
  };
  const isSafeObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  // updateAll remplace une collection entière : tableau JSON autorisé, taille bornée.
  const isSafeArray = (v: unknown): v is unknown[] =>
    Array.isArray(v) && v.length <= 500 && v.every(item => typeof item === 'object' && item !== null);

  const db = getDb();
  const results: any[] = [];
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  for (const m of mutations) {
    try {
      const { id, entity, action, data } = m;
      let applied = false;

      const required = ENTITY_PERMISSIONS[entity];
      const dataIsArray = Array.isArray(data);
      if (!required || (!isSafeObject(data) && !isSafeArray(data))) {
        results.push({ mutationId: id, status: 'ignored' });
        continue;
      }
      if (!userCan(required)) {
        appendAuditLog({
          userId: req.user!.userId,
          userEmail: req.user!.email,
          action: 'SYNC_PUSH_DENIED',
          resource: `sync:${entity}`,
          result: 'denied',
          ipAddress: ip,
          userAgent,
          details: `Permission requise : ${required}`
        });
        results.push({ mutationId: id, status: 'denied' });
        continue;
      }

      // Handle entity mutation (data validé objet OU tableau ci-dessus)
      const rec = data as Record<string, unknown>;
      if (entity === 'cmsSections') {
        if (action === 'update') {
          db.cmsSections = db.cmsSections.map(s => s.id === rec.id ? { ...s, ...rec } : s);
          applied = true;
        } else if (action === 'create') {
          db.cmsSections.push(rec);
          applied = true;
        }
      } else if (entity === 'platformConfig') {
        db.platformConfig = { ...db.platformConfig, ...data };
        applied = true;
      } else if (entity === 'directionsOrg') {
        if (action === 'updateAll') {
          db.directionsOrg = data as any;
          applied = true;
        }
      } else if (entity === 'dynamicMenus') {
        if (action === 'updateAll') {
          db.dynamicMenus = data as any;
          applied = true;
        }
      } else if (entity === 'dynamicModules') {
        if (action === 'updateAll') {
          db.dynamicModules = data as any;
          applied = true;
        }
      } else if (entity === 'quotes') {
        if (action === 'create') {
          db.quotes.unshift(rec);
          applied = true;
        } else if (action === 'update') {
          db.quotes = db.quotes.map(q => q.id === rec.id ? { ...q, ...rec } : q);
          applied = true;
        }
      } else if (entity === 'erp_transactions') {
        if (action === 'create') {
          db.erp.transactions.unshift(rec);
          applied = true;
        } else if (action === 'update') {
          // Champs de validation verrouillés : jamais via sync (RPC Phase DB).
          const { validationStatus, managerApprovedBy, dafOtpVerifiedAt, ...safe } = rec;
          void validationStatus; void managerApprovedBy; void dafOtpVerifiedAt;
          db.erp.transactions = db.erp.transactions.map(t => t.id === rec.id ? { ...t, ...safe } : t);
          applied = true;
        }
      }

      results.push({ mutationId: id, status: applied ? 'applied' : 'ignored' });
    } catch (err: any) {
      results.push({ mutationId: m.id, status: 'error', error: err.message });
    }
  }

  db.version += 1;
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'SYNC_PUSH_EXECUTED',
    resource: 'sync',
    result: 'success',
    ipAddress: ip,
    userAgent,
    details: `${mutations.length} mutations traitées par le moteur de synchronisation.`
  });

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    version: db.version,
    results
  });
});

// ==========================================
// 3. CMS & CONTENT MANAGEMENT API
// ==========================================

// Lecture du prototype CMS legacy : aucune route publique. Les sections
// contiennent les versions (old_value/new_value, auteurs) ; les exposer sans
// session revient à publier l'historique éditorial.
router.get('/cms', requireAuth, requirePermission('content.view'), (req: Request, res: Response) => {
  const db = getDb();
  res.json({ sections: db.cmsSections });
});

router.put('/cms/:id', requireAuth, requirePermission('content.update'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const db = getDb();

  const target = db.cmsSections.find(s => s.id === id);
  if (!target) {
    return res.status(404).json({ error: "Section CMS introuvable." });
  }

  const newVersion = {
    versionId: `v-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: req.user!.email,
    title,
    content,
    oldValue: target.content,
    newValue: content
  };

  target.title = title;
  target.content = content;
  target.lastModified = new Date().toISOString();
  target.author = req.user!.email;
  target.versions.unshift(newVersion);

  // If matches platformConfig key, live-sync
  if (target.contentKey && db.platformConfig[target.contentKey] !== undefined) {
    db.platformConfig[target.contentKey] = content;
  }

  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'CONTENT_UPDATED',
    resource: 'cms',
    resourceId: id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Mise à jour CMS section "${target.title}" (version ${newVersion.versionId})`
  });

  res.json({ success: true, section: target });
});

router.post('/cms/:id/rollback', requireAuth, requirePermission('content.update'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { versionId } = req.body;
  const db = getDb();

  const target = db.cmsSections.find(s => s.id === id);
  if (!target) return res.status(404).json({ error: "Section introuvable." });

  const version = target.versions.find((v: any) => v.versionId === versionId);
  if (!version) return res.status(404).json({ error: "Version introuvable pour rollback." });

  target.title = version.title;
  target.content = version.content;
  target.lastModified = new Date().toISOString();
  target.author = `${req.user!.email} (Rollback vers ${versionId})`;

  if (target.contentKey && db.platformConfig[target.contentKey] !== undefined) {
    db.platformConfig[target.contentKey] = version.content;
  }

  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'CONTENT_ROLLBACK',
    resource: 'cms',
    resourceId: id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Restauration de la version ${versionId}`
  });

  res.json({ success: true, section: target });
});

// ==========================================
// 4. ORGANIZATIONAL STRUCTURE (9 DIRECTIONS)
// ==========================================

router.get('/organization', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ directions: db.directionsOrg });
});

router.put('/organization', requireAuth, requirePermission('organization.update'), (req: Request, res: Response) => {
  const { directions } = req.body;
  if (!Array.isArray(directions)) {
    return res.status(400).json({ error: "Tableau de directions requis." });
  }

  const db = getDb();
  db.directionsOrg = directions;
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'ORGANIZATION_STRUCTURE_UPDATED',
    resource: 'organization',
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Structure réorganisée avec ${directions.length} directions.`
  });

  res.json({ success: true, directions: db.directionsOrg });
});

// ==========================================
// 5. DYNAMIC MENUS & MODULES
// ==========================================

router.get('/menus', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ menus: db.dynamicMenus });
});

router.put('/menus', requireAuth, requirePermission('settings.update'), (req: Request, res: Response) => {
  const { menus } = req.body;
  const db = getDb();
  db.dynamicMenus = menus;
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'MENUS_UPDATED',
    resource: 'menus',
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({ success: true, menus: db.dynamicMenus });
});

router.get('/modules', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ modules: db.dynamicModules });
});

router.put('/modules', requireAuth, requirePermission('modules.update'), (req: Request, res: Response) => {
  const { modules } = req.body;
  const db = getDb();
  db.dynamicModules = modules;
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'MODULES_UPDATED',
    resource: 'modules',
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({ success: true, modules: db.dynamicModules });
});

// ==========================================
// 6. USERS & RBAC MANAGEMENT
// ==========================================

router.get('/users', requireAuth, requirePermission('users.view'), (req: Request, res: Response) => {
  const db = getDb();
  const safeUsers = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    directionName: u.directionName,
    status: u.status,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
    permissions: u.permissions || []
  }));
  res.json({ users: safeUsers });
});

router.post('/users', requireAuth, requirePermission('users.create'), (req: Request, res: Response) => {
  const { name, email, phone, role, directionName, permissions, initialPassword } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nom et email obligatoires." });
  }

  const db = getDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà." });
  }

  const pass = initialPassword || crypto.randomBytes(8).toString('hex') + "!A1";
  const { hash, salt } = hashPassword(pass);

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    phone: phone || '+243 ',
    role: role || 'department_head',
    directionName: directionName || '01. DIRECTION GÉNÉRALE',
    passwordHash: hash,
    passwordSalt: salt,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    permissions: permissions || ['users.view', 'organization.view', 'content.view']
  };

  db.users.push(newUser);
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'USER_CREATED',
    resource: 'users',
    resourceId: newUser.id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Création du compte "${name}" avec rôle ${role}`
  });

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      directionName: newUser.directionName,
      status: newUser.status,
      permissions: newUser.permissions
    }
  });
});

router.put('/users/:id/status', requireAuth, requirePermission('users.update'), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const user = db.users.find(u => u.id === id);

  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (user.role === 'admin_general' && req.user!.userId === user.id) {
    return res.status(400).json({ error: "Impossible de suspendre votre propre session d'Admin Général." });
  }

  user.status = user.status === 'active' ? 'suspended' : 'active';
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'USER_STATUS_TOGGLED',
    resource: 'users',
    resourceId: user.id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Statut modifié vers : ${user.status}`
  });

  res.json({ success: true, status: user.status });
});

router.delete('/users/:id', requireAuth, requirePermission('users.delete'), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const user = db.users.find(u => u.id === id);

  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (user.role === 'admin_general') {
    return res.status(403).json({ error: "Impossible de supprimer le compte d'Administration Générale." });
  }

  db.users = db.users.filter(u => u.id !== id);
  db.sessions = db.sessions.filter(s => s.userId !== id);
  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'USER_DELETED',
    resource: 'users',
    resourceId: id,
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: `Suppression du compte : ${user.name} (${user.email})`
  });

  res.json({ success: true, message: "Utilisateur supprimé." });
});

// ==========================================
// 7. AUDIT LOGS & PLATFORM SETTINGS
// ==========================================

router.get('/admin/audit-logs', requireAuth, requirePermission('audit.view'), (req: Request, res: Response) => {
  const db = getDb();
  res.json({ logs: db.auditLogs });
});

router.get('/settings', requireAuth, (req: Request, res: Response) => {
  const db = getDb();
  const user = req.user!;
  const isSuperAdmin = user.role === 'admin_general' || user.role === 'dg_gerant';
  const hasFinance =
    isSuperAdmin ||
    user.role === 'daf_comptable' ||
    user.permissions.includes('finance.approve') ||
    user.permissions.includes('all_access') ||
    user.permissions.includes('god_mode');

  res.json({
    platformConfig: db.platformConfig,
    featureFlags: db.featureFlags,
    ...(hasFinance ? { financialSettings: db.financialSettings } : {})
  });
});

router.put('/settings', requireAuth, requirePermission('settings.update'), (req: Request, res: Response) => {
  const { platformConfig, featureFlags, financialSettings } = req.body;
  const db = getDb();

  if (platformConfig) db.platformConfig = { ...db.platformConfig, ...platformConfig };
  if (featureFlags) db.featureFlags = { ...db.featureFlags, ...featureFlags };
  if (financialSettings) db.financialSettings = { ...db.financialSettings, ...financialSettings };

  saveDb(db);

  appendAuditLog({
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'SETTINGS_CHANGED',
    resource: 'settings',
    result: 'success',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({
    success: true,
    platformConfig: db.platformConfig,
    featureFlags: db.featureFlags,
    financialSettings: db.financialSettings
  });
});

export default router;
