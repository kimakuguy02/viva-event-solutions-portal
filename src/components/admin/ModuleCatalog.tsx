import React, { useMemo, useState } from 'react';
import type { DynamicModule } from '../../types/cmsAndErp';
import { AdminCard, AdminSearch, AdminEmpty, StatusPill } from './AdminUI';
import { platformSession, usePlatformSession } from '../../services/platformSession';
import type { ModuleEnrichment } from '../../services/platformSession';
import { Copy, Eye, Boxes } from 'lucide-react';

/* Catalogue modules enrichi — champs riches (code, route, version, visibilité,
   ordre, flag, dépendances, menu) en SESSION via platformSession (R2-04 pour
   persistance) ; champs natifs (nom, description, catégorie, actif, archivé,
   rôles, permissions) persistés via onUpdateModules. Aucune écriture legacy. */

const CATEGORIES = ['Administration', 'CRM', 'Commercial', 'Projets', 'Événementiel', 'Production', 'Logistique', 'Finance', 'ERP', 'Communication', 'CMS', 'RH', 'Sécurité', 'Client', 'Système', 'management', 'engineering', 'logistics', 'security', 'digital', 'media', 'hr'];

interface Props {
  modules: DynamicModule[];
  onUpdateModules: (modules: DynamicModule[]) => void;
  menus: { id: string; name: string }[];
}

export const ModuleCatalog: React.FC<Props> = ({ modules, onUpdateModules, menus }) => {
  usePlatformSession();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('management');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const enrich = (id: string): ModuleEnrichment => platformSession.getEnrichment(id) ?? {
    code: id, route: '', version: '1.0.0', visibility: 'staff', order: 0, dependencies: [],
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return modules.filter((m) => {
      const matchQ = !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q);
      return matchQ && (filterCat === 'all' || m.category === filterCat);
    });
  }, [modules, search, filterCat]);

  const duplicate = (id: string) => {
    const src = modules.find((m) => m.id === id);
    if (!src) return;
    const copy: DynamicModule = {
      ...src,
      id: `${src.id}-copie-${Date.now().toString(36)}`,
      name: `${src.name} (copie)`,
      archived: false,
    };
    onUpdateModules([...modules, copy]);
    const e = enrich(id);
    platformSession.setEnrichment(copy.id, { ...e, code: copy.id });
  };

  return (
    <AdminCard
      title="Catalogue des modules"
      subtitle="Champs natifs persistés ; code/route/version/visibilité/ordre/flag/dépendances en session (R2-04). Aucune statistique inventée."
      action={
        <div className="flex items-center gap-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <AdminSearch value={search} onChange={setSearch} placeholder="Rechercher…" />
          <button onClick={() => setCreating((v) => !v)} className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer">
            + Nouveau
          </button>
        </div>
      }
    >
      {creating && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du module" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs">
            {CATEGORIES.slice(0, 15).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => {
              if (!newName.trim()) return;
              const id = `mod-${Date.now().toString(36)}`;
              onUpdateModules([...modules, { id, name: newName.trim(), description: '', icon: 'Boxes', category: newCategory as DynamicModule['category'], active: true, allowedRoles: [], permissions: [], archived: false }]);
              platformSession.setEnrichment(id, { code: id, route: '', version: '1.0.0', visibility: 'staff', order: modules.length, dependencies: [] });
              setNewName('');
              setCreating(false);
            }}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer"
          >
            Créer (persisté)
          </button>
          <p className="text-[10px] text-slate-500 sm:col-span-4">Création persistée via le contexte (Supabase-first + miroir). Détails riches en session (R2-04).</p>
        </div>
      )}
      {filtered.length === 0 ? (
        <AdminEmpty hint="Aucun module ne correspond." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((m) => {
            const e = enrich(m.id);
            return (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Boxes className="w-4 h-4 text-purple-300 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{m.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{e.code} • v{e.version} • ordre {e.order}</div>
                    </div>
                  </div>
                  <StatusPill active={m.active && !m.archived} activeLabel={m.archived ? 'Archivé' : 'Actif'} inactiveLabel="Inactif" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{m.description || '—'}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="text-slate-400">Route
                    <input value={e.route} onChange={(ev) => platformSession.setEnrichment(m.id, { route: ev.target.value })} placeholder="/route" className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono" />
                  </label>
                  <label className="text-slate-400">Visibilité
                    <select value={e.visibility} onChange={(ev) => platformSession.setEnrichment(m.id, { visibility: ev.target.value as ModuleEnrichment['visibility'] })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white">
                      <option value="public">public</option><option value="client">client</option><option value="staff">staff</option><option value="admin">admin</option>
                    </select>
                  </label>
                  <label className="text-slate-400">Version
                    <input value={e.version} onChange={(ev) => platformSession.setEnrichment(m.id, { version: ev.target.value })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono" />
                  </label>
                  <label className="text-slate-400">Flag associé
                    <input value={e.featureFlag ?? ''} onChange={(ev) => platformSession.setEnrichment(m.id, { featureFlag: ev.target.value || undefined })} placeholder="ex. liveHubEnabled" className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono" />
                  </label>
                  <label className="text-slate-400">Menu associé
                    <select value={e.menuId ?? ''} onChange={(ev) => platformSession.setEnrichment(m.id, { menuId: ev.target.value || undefined })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white">
                      <option value="">— aucun —</option>
                      {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                    </select>
                  </label>
                  <label className="text-slate-400">Dépendances (ids, séparés par ,)
                    <input value={e.dependencies.join(', ')} onChange={(ev) => platformSession.setEnrichment(m.id, { dependencies: ev.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(m.permissions ?? []).map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-800">{p}</span>
                  ))}
                  {(m.permissions ?? []).length === 0 && <span className="text-[10px] text-slate-600">Aucune permission déclarée</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button onClick={() => { setEditingId(m.id); setEditName(m.name); setEditDesc(m.description ?? ''); }} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer">
                    Modifier
                  </button>
                  <button onClick={() => duplicate(m.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer">
                    Dupliquer (persisté)
                  </button>
                  <button onClick={() => onUpdateModules(modules.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)))} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer ${m.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {m.active ? 'Actif' : 'Inactif'}
                  </button>
                  <button onClick={() => onUpdateModules(modules.map((x) => (x.id === m.id ? { ...x, archived: !x.archived } : x)))} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer">
                    {m.archived ? 'Désarchiver' : 'Archiver'}
                  </button>
                  <button onClick={() => setDetailId(detailId === m.id ? null : m.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer">
                    <Eye className="w-3 h-3" /> {detailId === m.id ? 'Masquer' : 'Prévisualiser'}
                  </button>
                </div>
                {editingId === m.id && (
                  <div className="grid grid-cols-1 gap-2 p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                    <input value={editName} onChange={(ev) => setEditName(ev.target.value)} placeholder="Nom" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs" />
                    <input value={editDesc} onChange={(ev) => setEditDesc(ev.target.value)} placeholder="Description" className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs" />
                    <div className="flex gap-2">
                      <button onClick={() => { onUpdateModules(modules.map((x) => (x.id === m.id ? { ...x, name: editName, description: editDesc } : x))); setEditingId(null); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer">Enregistrer (persisté)</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 cursor-pointer">Annuler</button>
                    </div>
                  </div>
                )}
                {detailId === m.id && (
                  <div className="p-3 rounded-xl bg-white text-slate-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aperçu carte module (lecture seule)</p>
                    <p className="font-black text-sm mt-1">{m.name}</p>
                    <p className="text-xs text-slate-600">{m.description}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">route : {e.route || '—'} • rôles : {(m.allowedRoles ?? []).join(', ') || '—'}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
};
