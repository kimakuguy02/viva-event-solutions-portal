import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { AuditEventItem, AuditResult, AuditLevel } from '../types/platformBuilder';

/* Hook audit branché uniquement sur Postgres (source de vérité).
   Vide = vide : aucune journalisation locale ni repli legacy n'est mélangé ici,
   sinon un tableau rempli ne prouverait plus rien. Une lecture impossible est
   exposée via `error`, jamais masquée. */

function toLevel(action: string, result: AuditResult): AuditLevel {
  if (result === 'denied' || result === 'failure') return 'warning';
  if (/DELETE|RESET|REVOKE|PASSWORD|ROLE|PERMISSION/i.test(action)) return 'warning';
  return 'info';
}

function coerceResult(v: unknown): AuditResult {
  return v === 'denied' ? 'denied' : v === 'failure' ? 'failure' : 'success';
}

export function useAuditEvents(limit = 100) {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'firestore' | 'none'>('none');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured() || !supabase) {
      setSource('none');
      setError('Supabase non configuré : journal d\'audit indisponible.');
      setLoading(false);
      return;
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setSource('none');
        setError('Session staff requise pour lire le journal d\'audit.');
        setLoading(false);
        return;
      }
      const { data, error: qErr } = await supabase
        .from('audit_logs')
        .select('id,created_at,action,resource,resource_id,metadata,result,actor_user_id')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (qErr) throw new Error(qErr.message);

      const rows = (data ?? []) as Record<string, unknown>[];
      const ids = [...new Set(rows.map((r) => r.actor_user_id).filter(Boolean))] as string[];
      let mailById = new Map<string, string>();
      if (ids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id,email').in('id', ids);
        mailById = new Map(((profs ?? []) as { id: string; email: string }[]).map((p) => [p.id, p.email]));
      }
      setEvents(
        rows.map((r) => ({
          id: String(r.id),
          timestamp: String(r.created_at ?? ''),
          actorEmail: (r.actor_user_id ? mailById.get(String(r.actor_user_id)) : null) ?? '—',
          action: String(r.action ?? ''),
          module: String(r.resource ?? '').split(':')[0] || String(r.resource ?? ''),
          resource: String(r.resource ?? ''),
          resourceId: String(r.resource_id ?? ''),
          result: coerceResult(r.result),
          level: toLevel(String(r.action ?? ''), coerceResult(r.result)),
          source: 'supabase' as const,
          details: typeof r.metadata === 'object' ? JSON.stringify(r.metadata) : undefined,
        })),
      );
      setSource('supabase');
    } catch (e) {
      setEvents([]);
      setSource('none');
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, loading, error, source, reload };
}
