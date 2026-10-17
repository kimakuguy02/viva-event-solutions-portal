// Throttle anti-abus côté client — Phase 1, Bloc 5.
// Complète (ne remplace pas) : rate-limit Express sur /auth/login,
// verrouillage modal client, et à venir throttling serveur/Edge sur les
// inserts publics (R4). Aucun secret ici. Limites : contournable en console,
// d'où la défense en profondeur côté serveur.

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const buckets = new Map<string, Bucket>();

export interface ThrottleResult {
  allowed: boolean;
  /** Secondes restantes avant réessai (0 si autorisé). */
  retryAfterSec: number;
  attemptsLeft: number;
}

/**
 * @param key Identifiant d'action (ex. 'quote:submit', 'reservation:submit').
 * @param maxAttempts Tentatives autorisées par fenêtre.
 * @param windowMs Durée de la fenêtre.
 * @param lockMs Durée de verrouillage après dépassement.
 */
export function throttleCheck(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000,
  lockMs = 5 * 60_000,
): ThrottleResult {
  const now = Date.now();
  const b = buckets.get(key) ?? { count: 0, windowStart: now, lockedUntil: 0 };

  if (b.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((b.lockedUntil - now) / 1000), attemptsLeft: 0 };
  }
  if (now - b.windowStart > windowMs) {
    b.count = 0;
    b.windowStart = now;
  }
  b.count += 1;
  if (b.count > maxAttempts) {
    b.lockedUntil = now + lockMs;
    buckets.set(key, b);
    return { allowed: false, retryAfterSec: Math.ceil(lockMs / 1000), attemptsLeft: 0 };
  }
  buckets.set(key, b);
  return { allowed: true, retryAfterSec: 0, attemptsLeft: maxAttempts - b.count };
}

export function throttleReset(key: string): void {
  buckets.delete(key);
}
