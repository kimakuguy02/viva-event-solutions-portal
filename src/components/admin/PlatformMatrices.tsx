import React, { useMemo, useState } from 'react';
import type { DynamicMenu, DynamicModule } from '../../types/cmsAndErp';
import { AdminCard, AdminEmpty } from './AdminUI';
import { RBAC_MATRIX, CANONICAL_ROLES, ORG_DIRECTIONS } from '../../data/platformRbac';
import { GitBranch, Network } from 'lucide-react';

/* Matrices de traçabilité — lecture seule, dérivées de données réelles
   (menus/modules chargés + matrice canonique + organisation officielle).
   Aucune écriture, aucune donnée inventée. */

interface Props {
  menus: DynamicMenu[];
  modules: DynamicModule[];
}

export const ModuleMenuPermissionMatrix: React.FC<Props> = ({ menus, modules }) => {
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const rows = useMemo(() => {
    return modules.map((mod) => {
      const linkedMenus = menus.filter((m) => {
        const hay = `${m.name} ${m.route} ${m.description ?? ''}`.toLowerCase();
        const needle = mod.name.toLowerCase().split(' ')[0];
        return m.moduleId === mod.id || (needle.length > 3 && hay.includes(needle));
      });
      const perms = mod.permissions ?? [];
      // Un rôle couvre le module s'il détient au moins une permission exacte du module.
      const rolesWith = CANONICAL_ROLES.filter((r) => {
        const grants = RBAC_MATRIX[r.code] ?? {};
        return perms.some((p) => {
          const [mod, act] = p.split('.');
          return ((grants[mod] ?? []) as string[]).includes(act);
        });
      });
      return { mod, linkedMenus, perms, rolesWith };
    });
  }, [menus, modules]);

  const shown = selectedModule === 'all' ? rows : rows.filter((r) => r.mod.id === selectedModule);

  return (
    <AdminCard
      title="Matrice Module → Menu → Permissions → Rôles"
      subtitle="Dérivée des modules/menus chargés et de la matrice canonique. Lecture seule."
      action={
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white max-w-[16rem]">
          <option value="all">Tous les modules</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      }
    >
      {shown.length === 0 ? (
        <AdminEmpty hint="Aucun module chargé." />
      ) : (
        <div className="space-y-3">
          {shown.map(({ mod, linkedMenus, perms, rolesWith }) => (
            <div key={mod.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <GitBranch className="w-4 h-4 text-purple-300" /> {mod.name}
                <span className="font-mono text-[10px] text-slate-500">{mod.id}</span>
              </div>
              <div className="pl-5 text-xs space-y-1.5 border-l-2 border-slate-800 ml-1">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Menus liés ({linkedMenus.length}) : </span>
                  {linkedMenus.length === 0
                    ? <span className="text-slate-600">aucun lien détecté (liaison explicite : R2-09)</span>
                    : linkedMenus.map((m) => <span key={m.id} className="mr-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">{m.name} → /{m.route}</span>)}
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Permissions du module ({perms.length}) : </span>
                  {perms.length === 0
                    ? <span className="text-slate-600">aucune déclarée</span>
                    : perms.map((p) => <span key={p} className="mr-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-[10px]">{p}</span>)}
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Rôles couverts ({rolesWith.length}) : </span>
                  {rolesWith.length === 0
                    ? <span className="text-slate-600">aucun rôle canonique ne couvre ces permissions</span>
                    : rolesWith.map((r) => <span key={r.code} className="mr-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">{r.code}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
};

export const RoleOrgModuleMatrix: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('DAF_COMPTABLE');
  const grants = RBAC_MATRIX[selectedRole] ?? {};

  return (
    <AdminCard
      title="Matrice Rôle → Organisation → Modules"
      subtitle="Lecture seule : organisation officielle × matrice canonique."
      action={
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono max-w-[16rem]">
          {CANONICAL_ROLES.map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
        </select>
      }
    >
      <div className="space-y-3">
        {ORG_DIRECTIONS.map((d) => (
          <div key={d.code} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <Network className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-amber-400">{d.code}</span> {d.name}
            </div>
            <div className="pl-6 mt-1.5 text-[11px] text-slate-400">
              Sous-directions : {d.subDirections.join(' • ')}
            </div>
            <div className="pl-6 mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
              {d.linkedModules.length === 0 && <span className="text-slate-600">Modules : —</span>}
              {d.linkedModules.map((m) => <span key={m} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">{m}</span>)}
              {d.linkedPermissions.map((p) => {
                const [mod, act] = p.split('.');
                const covered = ((grants[mod] ?? []) as string[]).includes(act);
                return (
                  <span key={p} title={covered ? 'Couverte par le rôle' : 'Non couverte par le rôle'} className={`px-2 py-0.5 rounded font-mono border ${covered ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    {p} {covered ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">✓/✗ = couverture par le rôle sélectionné selon la matrice canonique. Rattachements utilisateurs/modules : R2-07/R2-09.</p>
    </AdminCard>
  );
};
