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
    const { data } = await sb.auth.getUser();
    await sb.from('audit_logs').insert({
      actor_user_id: data.user?.id ?? null,
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
