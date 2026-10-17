// Services Menus & Modules — Wave 2. SSOT = public.menus / public.modules.
// Champs TS sans équivalent PG (minRole, allowedRoles, permissions, menuId…)
// conservés dans modules.config / déduits de visibility ; fidélité complète
// à la migration des données (vague suivante), sans perte à l'écriture.
import { requireSupabase } from '../supabase';
import type { DynamicMenu, DynamicModule } from '../../types/cmsAndErp';

const TAG_TO_VISIBILITY: Record<string, string> = { public: 'public', client: 'client', admin: 'admin', erp: 'staff' };
const VIS_TO_TAG: Record<string, DynamicMenu['tag']> = { public: 'public', client: 'client', admin: 'admin', staff: 'erp' };

/* ---------- MENUS ---------- */

export function pgToMenu(p: Record<string, string | number | boolean | null>): DynamicMenu {
  return {
    id: String(p.code ?? p.id),
    name: String(p.label ?? ''),
    displayName: String(p.label ?? ''),
    icon: String(p.icon ?? ''),
    description: '',
    route: String(p.route ?? ''),
    order: Number(p.position ?? 0),
    showInNavbar: Boolean(p.show_in_navbar ?? true),
    active: Boolean(p.is_active ?? true),
    minRole: 'visitor',
    tag: VIS_TO_TAG[String(p.visibility ?? 'public')] ?? 'public',
  };
}

export async function fetchMenus(): Promise<DynamicMenu[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('menus').select('*').order('position');
  if (error) throw new Error(`Lecture menus impossible : ${error.message}`);
  return ((data ?? []) as Record<string, string | number | boolean | null>[]).map(pgToMenu);
}

export async function saveMenus(menus: DynamicMenu[]): Promise<DynamicMenu[]> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const existing = await sb.from('menus').select('code');
  if (existing.error) throw new Error(`Écriture menus refusée : ${existing.error.message}`);
  const known = new Set(((existing.data ?? []) as { code: string }[]).map((r) => r.code));
  for (const m of menus) {
    const payload = {
      code: m.id,
      label: m.displayName || m.name,
      route: m.route,
      icon: m.icon,
      position: m.order,
      is_active: m.active,
      show_in_navbar: m.showInNavbar,
      visibility: TAG_TO_VISIBILITY[m.tag] ?? 'public',
    };
    const { error } = known.has(m.id)
      ? await sb.from('menus').update(payload).eq('code', m.id)
      : await sb.from('menus').insert(payload);
    if (error) throw new Error(`Écriture menu '${m.id}' refusée : ${error.message}`);
    known.add(m.id);
  }
  for (const row of (existing.data ?? []) as { code: string }[]) {
    if (!menus.some((m) => m.id === row.code)) {
      const { error } = await sb.from('menus').delete().eq('code', row.code);
      if (error) throw new Error(`Suppression menu '${row.code}' refusée : ${error.message}`);
    }
  }
  return fetchMenus(); // relecture de confirmation
}

/* ---------- MODULES ---------- */

export function pgToModule(p: Record<string, unknown>): DynamicModule {
  const cfg = (p.config as Record<string, string[] | string> | null) ?? {};
  return {
    id: String(p.code ?? p.id),
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    icon: String(p.icon ?? ''),
    category: (p.category as DynamicModule['category']) ?? 'management',
    active: Boolean(p.is_active ?? true),
    allowedRoles: (cfg.allowedRoles as string[]) ?? [],
    permissions: (cfg.permissions as string[]) ?? [],
    archived: Boolean(p.archived ?? false),
  };
}

export async function fetchModules(): Promise<DynamicModule[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('modules').select('*').order('position');
  if (error) throw new Error(`Lecture modules impossible : ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map(pgToModule);
}

export async function saveModules(mods: DynamicModule[]): Promise<DynamicModule[]> {
  const sb = requireSupabase();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new Error('Session requise.');
  const existing = await sb.from('modules').select('code');
  if (existing.error) throw new Error(`Écriture modules refusée : ${existing.error.message}`);
  const known = new Set(((existing.data ?? []) as { code: string }[]).map((r) => r.code));
  let pos = 0;
  for (const m of mods) {
    const payload = {
      code: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      category: m.category,
      route: '',
      is_active: m.active,
      archived: m.archived,
      position: pos++,
      config: { allowedRoles: m.allowedRoles, permissions: m.permissions },
    };
    const { error } = known.has(m.id)
      ? await sb.from('modules').update(payload).eq('code', m.id)
      : await sb.from('modules').insert(payload);
    if (error) throw new Error(`Écriture module '${m.id}' refusée : ${error.message}`);
    known.add(m.id);
  }
  for (const row of (existing.data ?? []) as { code: string }[]) {
    if (!mods.some((m) => m.id === row.code)) {
      const { error } = await sb.from('modules').delete().eq('code', row.code);
      if (error) throw new Error(`Suppression module '${row.code}' refusée : ${error.message}`);
    }
  }
  return fetchModules(); // relecture de confirmation
}
