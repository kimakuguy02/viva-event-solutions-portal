import React, { useState } from 'react';
import { platformSession, usePlatformSession } from '../../services/platformSession';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import { Bell, CheckCheck } from 'lucide-react';

/* Centre de notifications unifié — in-app uniquement (R4-25).
   Sources RÉELLES : journal d'événements domaine de la session (actions propres
   : devis, tâches, projets, validations) + refus/erreurs de l'audit réel.
   Canaux externes (email/SMS/push/WhatsApp) : NON connectés — affichés comme tels,
   jamais prétendus fonctionnels. Aucune notification inventée. */

const KIND_LABEL: Record<string, string> = {
  demande: 'Demande', devis: 'Devis', projet: 'Projet', tache: 'Tâche',
  validation: 'Validation', securite: 'Sécurité', systeme: 'Système',
};

export const NotificationCenter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  usePlatformSession();
  const { events: auditEvents } = useAuditEvents(50);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const domain = platformSession.listDomainEvents().map(e => ({
    id: e.id,
    time: e.time,
    category: KIND_LABEL[e.kind] ?? e.kind,
    title: e.label,
    detail: e.actorEmail ? `Par ${e.actorEmail}` : 'Session en cours',
    kind: 'domain' as const,
  }));
  const denied = auditEvents
    .filter(e => e.result === 'denied' || e.result === 'failure')
    .map(e => ({
      id: `audit-${e.id}`,
      time: e.timestamp,
      category: 'Sécurité',
      title: e.action,
      detail: `${e.actorEmail} • ${e.resource}`,
      kind: 'security' as const,
    }));

  const all = [...domain, ...denied].sort((a, b) => (a.time < b.time ? 1 : -1));
  const unread = all.filter(n => !readIds.has(n.id));
  const shown = filter === 'unread' ? unread : all;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {!compact && (
        <p className="text-[11px] text-slate-500">
          In-app uniquement. Email/SMS/push/WhatsApp : non connectés (R4-25). Aucune notification inventée.
        </p>
      )}
      <div className="flex items-center gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${filter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
          Toutes ({all.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${filter === 'unread' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
          Non lues ({unread.length})
        </button>
        <span className="flex-1" />
        <button onClick={() => setReadIds(new Set(all.map(n => n.id)))} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer">
          <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
        </button>
      </div>
      {shown.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-950 border border-dashed border-slate-700">
          <Bell className="w-6 h-6 mx-auto text-slate-600" />
          <p className="text-xs font-bold text-slate-300 mt-2">Aucune donnée disponible</p>
          <p className="text-[11px] text-slate-500">Vos actions et les refus de sécurité apparaîtront ici.</p>
        </div>
      ) : (
        <div className={`space-y-2 ${compact ? 'max-h-80 overflow-y-auto' : ''}`}>
          {shown.map(n => (
            <button
              key={n.id}
              onClick={() => setReadIds(prev => new Set(prev).add(n.id))}
              className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-colors ${readIds.has(n.id) ? 'bg-slate-950 border-slate-800 opacity-70' : 'bg-slate-900 border-amber-500/30'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-amber-400">{n.category}</span>
                <span className="text-[10px] text-slate-500 font-mono">{n.time ? new Date(n.time).toLocaleString('fr-FR') : '—'}</span>
              </div>
              <p className="text-xs font-bold text-white mt-1">{n.title}</p>
              <p className="text-[11px] text-slate-400">{n.detail}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
