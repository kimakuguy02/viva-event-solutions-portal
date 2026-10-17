import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { subscribeFirestoreCollection } from '../services/firebase';
import type { AuditEventItem, AuditResult, AuditLevel } from '../types/platformBuilder';

/* Hook audit multi-source RÉELLE, sans événement fabriqué.
   Ordre : Supabase (si session + permission) → Firestore (temps réel) →
   localStorage legacy. Chaque événement porte sa source. Vide = vide. */

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
  const [source, setSource] = useState<'supabase' | 'firestore' | 'local' | 'none'>('none');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    // 1) Supabase (réel, RLS)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const { data, error: qErr } = await supabase
            .from('audit_logs')
            .select('id,created_at,action,resource,resource_id,metadata,result,actor_user_id')
            .order('created_at', { ascending: false })
            .limit(limit);
          if (!qErr && data) {
            const ids = [...new Set(data.map((r: { actor_user_id: string | null }) => r.actor_user_id).filter(Boolean))] as string[];
            let mailById = new Map<string, string>();
            if (ids.length > 0) {
              const { data: profs } = await supabase.from('profiles').select('id,email').in('id', ids);
              mailById = new Map(((profs ?? []) as { id: string; email: string }[]).map((p) => [p.id, p.email]));
            }
            setEvents(
              (data as Record<string, unknown>[]).map((r) => ({
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
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[useAuditEvents] Supabase indisponible :', e);
      }
    }
    // 2) Firestore temps réel (legacy réel)
    try {
      const unsub = subscribeFirestoreCollection<Record<string, unknown>>('audit_logs', (items) => {
        setEvents(
          items.slice(0, limit).map((r, i) => ({
            id: String(r.id ?? `fs-${i}`),
            timestamp: String(r.timestamp ?? r.createdAt ?? ''),
            actorEmail: String(r.userEmail ?? r.actorEmail ?? '—'),
            action: String(r.action ?? ''),
            module: String(r.resource ?? ''),
            resource: String(r.resource ?? ''),
            resourceId: String(r.resourceId ?? ''),
            result: coerceResult(r.result),
            level: toLevel(String(r.action ?? ''), coerceResult(r.result)),
            source: 'firestore' as const,
            details: typeof r.details === 'string' ? r.details : undefined,
          })),
        );
        setSource('firestore');
        setLoading(false);
      });
      // Si le listener ne répond pas en 4 s, repli local.
      const timer = setTimeout(() => {
        try {
          const raw = localStorage.getItem('viva_audit_logs');
          if (raw) {
            const arr = JSON.parse(raw) as Record<string, unknown>[];
            setEvents(
              arr.slice(0, limit).map((r, i) => ({
                id: String(r.id ?? `local-${i}`),
                timestamp: String(r.timestamp ?? ''),
                actorEmail: String(r.userEmail ?? '—'),
                action: String(r.action ?? ''),
                module: 'legacy',
                resource: 'legacy',
                resourceId: '',
                result: coerceResult(r.result),
                level: 'info' as AuditLevel,
                source: 'local' as const,
              })),
            );
            setSource('local');
          }
          setLoading(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }, 4000);
      return () => {
        clearTimeout(timer);
        unsub();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    reload().then((c) => {
      cleanup = c as unknown as (() => void) | undefined;
    });
    return () => cleanup?.();
  }, [reload]);

  return { events, loading, error, source, reload };
}
