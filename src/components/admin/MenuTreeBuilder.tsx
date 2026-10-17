import React, { useMemo, useState } from 'react';
import type { DynamicMenu } from '../../types/cmsAndErp';
import { AdminCard, AdminSearch, AdminEmpty, StatusPill } from './AdminUI';
import { platformSession, usePlatformSession } from '../../services/platformSession';
import { CornerDownRight, Copy, ArrowUp, ArrowDown, Eye, ExternalLink } from 'lucide-react';

/* Menu Builder — arborescence + recherche + duplication + réorganisation.
   Persistance RÉELLE via onUpdateMenus (ordre, actif, champs) ; la hiérarchie
   parent/enfant vit en SESSION, badgée « Configuration temporaire » en
   attendant R2-03. Aucune écriture legacy ajoutée. */

interface Props {
  menus: DynamicMenu[];
  onUpdateMenus: (menus: DynamicMenu[]) => void;
}

interface TreeNode {
  menu: DynamicMenu;
  children: TreeNode[];
}

function buildTree(menus: DynamicMenu[]): TreeNode[] {
  const byId = new Map(menus.map((m) => [m.id, { menu: m, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  for (const m of menus) {
    const parent = platformSession.getParent(m.id);
    const node = byId.get(m.id);
    if (!node) continue;
    if (parent && byId.has(parent)) byId.get(parent)?.children.push(node);
    else roots.push(node);
  }
  const sortFn = (a: TreeNode, b: TreeNode) => a.menu.order - b.menu.order;
  roots.sort(sortFn);
  byId.forEach((n) => n.children.sort(sortFn));
  return roots;
}

export const MenuTreeBuilder: React.FC<Props> = ({ menus, onUpdateMenus }) => {
  usePlatformSession();
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(menus), [menus]);
  const hasTemp = platformSession.hasTreeData();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return menus;
    return menus.filter((m) => m.name.toLowerCase().includes(q) || m.route.toLowerCase().includes(q) || m.tag.includes(q));
  }, [menus, search]);

  const move = (id: string, dir: -1 | 1) => {
    const siblings = [...menus].sort((a, b) => a.order - b.order);
    const i = siblings.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= siblings.length) return;
    const a = siblings[i];
    siblings[i] = { ...siblings[j], order: a.order };
    siblings[j] = { ...a, order: siblings[j].order };
    const orderOf = new Map(siblings.map((m) => [m.id, m.order]));
    onUpdateMenus(menus.map((m) => (orderOf.has(m.id) ? { ...m, order: orderOf.get(m.id) as number } : m)));
  };

  const duplicate = (id: string) => {
    const src = menus.find((m) => m.id === id);
    if (!src) return;
    const copy: DynamicMenu = {
      ...src,
      id: `${src.id}-copie-${Date.now().toString(36)}`,
      name: `${src.name} (copie)`,
      route: `${src.route}-copie`,
      order: Math.max(...menus.map((m) => m.order), 0) + 1,
    };
    onUpdateMenus([...menus, copy]);
  };

  const setParent = (id: string, parentId: string | null) => {
    platformSession.setParent(id, parentId);
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => (
    <div key={node.menu.id}>
      <div
        className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800"
        style={{ marginLeft: depth * 22 }}
      >
        {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
        <span className="font-mono text-[10px] text-slate-500 w-6">{node.menu.order}</span>
        <span className="text-xs font-bold text-white flex-1 min-w-[8rem]">{node.menu.name}</span>
        <span className="font-mono text-[10px] text-slate-500">/{node.menu.route}</span>
        <StatusPill active={node.menu.active} />
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{node.menu.tag}</span>
        <select
          value={platformSession.getParent(node.menu.id) ?? ''}
          onChange={(e) => setParent(node.menu.id, e.target.value || null)}
          title="Parent (session — R2-03 pour persistance)"
          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 max-w-[10rem]"
        >
          <option value="">∅ racine</option>
          {menus.filter((m) => m.id !== node.menu.id).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="flex items-center gap-1">
          <button onClick={() => move(node.menu.id, -1)} title="Monter" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><ArrowUp className="w-3 h-3" /></button>
          <button onClick={() => move(node.menu.id, 1)} title="Descendre" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><ArrowDown className="w-3 h-3" /></button>
          <button onClick={() => duplicate(node.menu.id)} title="Dupliquer (persisté)" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><Copy className="w-3 h-3" /></button>
          <button onClick={() => setEditId(editId === node.menu.id ? null : node.menu.id)} title="Aperçu item" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><Eye className="w-3 h-3" /></button>
        </span>
      </div>
      {editId === node.menu.id && (
        <div className="ml-6 mt-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 grid grid-cols-2 gap-2" style={{ marginLeft: depth * 22 + 12 }}>
          <span>Icône : <strong className="text-white font-mono">{node.menu.icon}</strong></span>
          <span>Affichage navbar : <strong className="text-white">{node.menu.showInNavbar ? 'oui' : 'non'}</strong></span>
          <span>Rôle min : <strong className="text-white font-mono">{node.menu.minRole}</strong></span>
          <span>Description : {node.menu.description || '—'}</span>
        </div>
      )}
      {node.children.map((c) => renderNode(c, depth + 1))}
    </div>
  );

  return (
    <AdminCard
      title="Arborescence des menus"
      subtitle="Ordre/activation/duplication persistés (contexte). Hiérarchie parent/enfant en session — « Configuration temporaire » (R2-03)."
      action={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} placeholder="Rechercher…" />
          <button onClick={() => setPreview((v) => !v)} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer">
            {preview ? 'Masquer l’aperçu' : 'Aperçu navigation'}
          </button>
        </div>
      }
    >
      {hasTemp && (
        <p className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          Configuration temporaire : la hiérarchie parent/enfant sera perdue au rechargement tant que R2-03 n’est pas implémenté. L’ordre et l’activation, eux, sont persistés.
        </p>
      )}
      {preview ? (
        <nav className="p-4 rounded-2xl bg-white text-slate-900 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Aperçu — barre de navigation publique (lecture seule)</p>
          {tree.filter((n) => n.menu.active && n.menu.showInNavbar).map((n) => (
            <div key={n.menu.id}>
              <div className="flex items-center gap-2 py-1.5 font-bold text-sm">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />{n.menu.displayName || n.menu.name}
              </div>
              {n.children.filter((c) => c.menu.active).map((c) => (
                <div key={c.menu.id} className="pl-6 py-1 text-xs text-slate-600">— {c.menu.displayName || c.menu.name}</div>
              ))}
            </div>
          ))}
        </nav>
      ) : search ? (
        menus.length === 0 ? <AdminEmpty /> : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <div key={m.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
                <span className="font-bold text-white flex-1">{m.name}</span>
                <span className="font-mono text-slate-500">/{m.route}</span>
                <StatusPill active={m.active} />
              </div>
            ))}
            {filtered.length === 0 && <AdminEmpty hint="Aucun menu ne correspond." />}
          </div>
        )
      ) : (
        <div className="space-y-2">{tree.map((n) => renderNode(n, 0))}</div>
      )}
    </AdminCard>
  );
};
