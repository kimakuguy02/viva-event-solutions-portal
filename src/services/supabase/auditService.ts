// Audit serveur — Wave 2. Actor = id de session (trigger 010 l'impose serveur
// une fois la migration appliquée). Échec d'audit = avertissement, jamais bloquant.
import { requireSupabase } from '../supabase';

export async function logAudit(
  action: string,
  resource: string,
  resourceId?: string,
  metadata: Record<string, unknown> = {},
  result: 'success' | 'failure' | 'denied' = 'success',
): Promise<void> {
  try {
    const sb = requireSupabase();
    // Sans session, audit_logs répond 401 (policy authentifiée). Les parcours
    // publics sont audités côté serveur par leur RPC, pas par le navigateur.
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return;
    await sb.from('audit_logs').insert({
      actor_user_id: sessionData.session.user.id,
      action,
      resource,
      resource_id: resourceId ?? '',
      metadata,
      result,
    });
  } catch (e) {
    console.warn('[auditService] Audit non bloquant :', e);
  }
}
