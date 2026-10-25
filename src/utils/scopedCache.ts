/* Cache local cloisonné par compte.
   Le cache historique (viva_projects, viva_quotes) ne porte aucune identité :
   le charger tel quel sur un poste partagé expose les données du compte précédent.
   Les clés sont désormais suffixées par le compte, et l'ancien cache n'est remis
   qu'à un compte de direction, jamais à un compte non privilégié. */

export interface ScopedCacheOwner {
  id: string;
  role: string;
  email?: string;
}

const LEGACY_ADOPTED_KEY = 'viva_legacy_cache_adopted_by';
const PRIVILEGED_ROLES = new Set(['admin_general', 'admin', 'dg_gerant']);

export function cacheScopeFor(owner: ScopedCacheOwner): string {
  if (owner.role === 'visitor') return 'anonymous';
  return owner.id || owner.email || 'anonymous';
}

export function scopedCacheKey(base: string, scope: string): string {
  return `${base}::${scope}`;
}

export function readScopedCache<T>(storage: Storage, base: string, scope: string): T[] | null {
  try {
    const raw = storage.getItem(scopedCacheKey(base, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

/* Reprise unique de l'ancien cache vers le compte de direction courant.
   Un compte non privilégié ne reçoit jamais ce cache, faute de pouvoir prouver
   à qui il appartient. Aucune clé historique n'est supprimée. */
export function adoptLegacyCache(storage: Storage, owner: ScopedCacheOwner, bases: string[]): boolean {
  if (!PRIVILEGED_ROLES.has(owner.role)) return false;
  const scope = cacheScopeFor(owner);
  if (storage.getItem(LEGACY_ADOPTED_KEY) === scope) return false;

  let adopted = false;
  for (const base of bases) {
    const target = scopedCacheKey(base, scope);
    const legacy = storage.getItem(base);
    if (legacy && storage.getItem(target) === null) {
      try {
        storage.setItem(target, legacy);
        adopted = true;
      } catch {
        /* quota ou stockage indisponible : le cache historique reste intact */
      }
    }
  }
  try {
    storage.setItem(LEGACY_ADOPTED_KEY, scope);
  } catch {
    /* noop */
  }
  return adopted;
}
