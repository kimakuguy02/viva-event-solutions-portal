import React, { useMemo, useState } from 'react';
import { AdminCard, AdminSearch, AdminEmpty, StatusPill } from './AdminUI';
import type { RoleDefinition, PlatformAction } from '../../types/platformBuilder';
import { CANONICAL_ROLES, RBAC_MODULES as MODULES, RBAC_ACTIONS as ACTIONS, RBAC_MATRIX as MATRIX } from '../../data/platformRbac';
import { Plus, Copy, Power, Pencil, ShieldCheck } from 'lucide-react';

/* Rôles & permissions — interface produit complète.
   Matrice canonique = importée de data/platformRbac (reflet seeds 003).
   Rôles personnalisés = état de SESSION uniquement, avec mention explicite
   qu'ils nécessitent la persistance DB (DATA REQUIREMENT R2-01). Aucune
   écriture legacy ajoutée, aucun faux backend. */

export const RolesPermissionsManager: React.FC = () => {
  const [roles, setRoles] = useState<RoleDefinition[]>(CANONICAL_ROLES);
  const [customGrants, setCustomGrants] = useState<Record<string, Record<string, PlatformAction[]>>>({});
  const [selected, setSelected] = useState<string>('SUPER_ADMIN');
  const [search, setSearch] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftCode, setDraftCode] = useState('');

  const allRoles = useMemo(() => roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.includes(search.toUpperCase())), [roles, search]);
  const sel = roles.find((r) => r.code === selected) ?? roles[0];
  const grantsFor = (code: string): Record<string, PlatformAction[]> => MATRIX[code] ?? customGrants[code] ?? {};

  const createCustomRole = () => {
    const code = draftCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!code || !draftName.trim() || roles.some((r) => r.code === code)) return;
    setRoles((prev) => [...prev, { id: `custom-${Date.now()}`, code, name: draftName.trim(), description: 'Rôle personnalisé (session — persistance DB requise).', isSystem: false, isActive: true }]);
    setCustomGrants((prev) => ({ ...prev, [code]: {} }));
    setSelected(code);
    setDraftName('');
    setDraftCode('');
  };

  const duplicateRole = (code: string) => {
    const src = roles.find((r) => r.code === code);
    if (!src) return;
    const newCode = `${src.code}_COPIE`;
    if (roles.some((r) => r.code === newCode)) return;
    setRoles((prev) => [...prev, { ...src, id: `custom-${Date.now()}`, code: newCode, name: `${src.name} (copie)`, isSystem: false }]);
    setCustomGrants((prev) => ({ ...prev, [newCode]: { ...(MATRIX[code] ?? customGrants[code] ?? {}) } }));
    setSelected(newCode);
  };

  const toggleActive = (code: string) => {
    setRoles((prev) => prev.map((r) => (r.code === code ? { ...r, isActive: !r.isActive } : r)));
  };

  const toggleGrant = (code: string, module: string, action: PlatformAction) => {
    const role = roles.find((r) => r.code === code);
    if (!role || role.isSystem) return; // rôles système : matrice seed en lecture seule
    setCustomGrants((prev) => {
      const cur = { ...(prev[code] ?? {}) };
      const set = new Set(cur[module] ?? []);
      if (set.has(action)) set.delete(action);
      else set.add(action);
      cur[module] = [...set];
      return { ...prev, [code]: cur };
    });
  };

  const effectiveCount = Object.values(grantsFor(sel.code)).reduce((n, a) => n + a.length, 0);

  return (
    <div className="space-y-4">
      <AdminCard
        title="Rôles"
        subtitle="9 rôles canoniques (reflet seeds 003, lecture seule) + rôles personnalisés de session — persistance DB requise (R2-01)."
        action={<AdminSearch value={search} onChange={setSearch} placeholder="Rechercher un rôle…" />}
      >
        {allRoles.length === 0 ? (
          <AdminEmpty hint="Aucun rôle ne correspond à la recherche." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {allRoles.map((r) => (
              <button
                key={r.code}
                onClick={() => setSelected(r.code)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selected === r.code ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black text-amber-400">{r.code}</span>
                  <StatusPill active={r.isActive} />
                </div>
                <div className="text-sm font-bold text-white mt-1">{r.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{r.description}</div>
                <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                  {!r.isSystem && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">personnalisé</span>
                  )}
                  <span className="flex-1" />
                  <span title="Dupliquer" onClick={() => duplicateRole(r.code)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />
                  </span>
                  {!r.isSystem && (
                    <span title="Activer/désactiver" onClick={() => toggleActive(r.code)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
                      <Power className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Créer un rôle personnalisé" subtitle="Session uniquement — sera persisté via Supabase (R2-01). Aucune écriture legacy ajoutée.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={draftCode} onChange={(e) => setDraftCode(e.target.value)} placeholder="CODE (ex. AUDITEUR_EXTERNE)" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500" />
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Nom affiché" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
          <button onClick={createCustomRole} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Créer
          </button>
        </div>
      </AdminCard>

      <AdminCard
        title={`Matrice effective — ${sel.code}`}
        subtitle={`${effectiveCount} permission(s) effective(s). Rôles système en lecture seule ; personnalisés modifiables (session).`}
        action={
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Effectif calculé, pas déclaré
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2 px-3 text-left">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="py-2 px-1 text-center font-mono text-[10px]">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {MODULES.map((m) => (
                <tr key={m} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-slate-300">{m}</td>
                  {ACTIONS.map((a) => {
                    const on = (grantsFor(sel.code)[m] ?? []).includes(a);
                    const editable = !sel.isSystem;
                    return (
                      <td key={a} className="py-2 px-1 text-center">
                        <button
                          disabled={!editable}
                          onClick={() => toggleGrant(sel.code, m, a)}
                          className={`w-5 h-5 rounded-md text-[10px] font-black transition-all ${
                            on ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                          } ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                          title={on ? 'Accordée' : 'Refusée'}
                        >
                          {on ? '✓' : '·'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sel.isSystem && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Matrice seed en lecture seule — toute modification d'un rôle système passera par migration/Edge SUPER_ADMIN.
          </p>
        )}
      </AdminCard>
    </div>
  );
};
