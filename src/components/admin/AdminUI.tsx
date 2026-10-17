import React from 'react';
import { Search, Inbox, AlertTriangle } from 'lucide-react';

/* Briques UI partagées du Super Admin — cohérence professionnelle :
   cartes, recherche, états vide/erreur/chargement. Aucune donnée ici. */

export const AdminCard: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  action,
  children,
}) => (
  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export const AdminSearch: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({
  value,
  onChange,
  placeholder,
}) => (
  <div className="relative w-full sm:w-72">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
    />
  </div>
);

export const AdminEmpty: React.FC<{ title?: string; hint?: string }> = ({
  title = 'Aucune donnée disponible',
  hint,
}) => (
  <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2">
    <Inbox className="w-8 h-8 mx-auto text-slate-600" />
    <p className="text-sm font-bold text-slate-300">{title}</p>
    {hint && <p className="text-xs text-slate-500">{hint}</p>}
  </div>
);

export const AdminError: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-3">
    <span className="flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      {message}
    </span>
    {onRetry && (
      <button onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs cursor-pointer shrink-0">
        Réessayer
      </button>
    )}
  </div>
);

export const AdminLoading: React.FC<{ label?: string }> = ({ label = 'Chargement…' }) => (
  <div className="p-8 flex flex-col items-center gap-3 text-slate-400">
    <span className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-bold">{label}</span>
  </div>
);

export const StatusPill: React.FC<{ active: boolean; activeLabel?: string; inactiveLabel?: string }> = ({
  active,
  activeLabel = 'Actif',
  inactiveLabel = 'Inactif',
}) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
      active
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    }`}
  >
    {active ? activeLabel : inactiveLabel}
  </span>
);
