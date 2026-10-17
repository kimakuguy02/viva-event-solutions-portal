-- =====================================================================
-- VIVA — VAGUE A : BLOC SQL FINAL (012 → 015 + correction F-01)
-- À exécuter par le PROPRIÉTAIRE dans : Supabase Dashboard → SQL Editor
-- Sur le projet VIVA actuel. Ordre strict, une seule exécution (réexécutable
-- sans doublon). Le SQL Editor exécute le script en UNE transaction :
-- échec ⇒ tout ou rien par script (pas d'état intermédiaire).
-- INTERDIT : DROP TABLE, TRUNCATE, DELETE sur données existantes (aucun ci-dessous).
-- =====================================================================

-- ================= 0. PRÉCONDITIONS (bloquantes si non remplies) =================
do $$
begin
  if to_regclass('public.roles') is null or to_regclass('public.permissions') is null then
    raise exception 'PRÉCONDITION MANQUANTE : tables roles/permissions absentes (001 non appliquée). STOP.';
  end if;
  if to_regclass('public.cms_sections') is null or to_regclass('public.menus') is null
     or to_regclass('public.modules') is null or to_regclass('public.form_fields') is null
     or to_regclass('public.media_items') is null or to_regclass('public.app_settings') is null then
    raise exception 'PRÉCONDITION MANQUANTE : tables 004 absentes. STOP.';
  end if;
  if not exists (select 1 from public.app_settings where key = 'features.defaults') then
    raise notice 'AVERTISSEMENT : seed features.defaults absent — 013 insérera 0 flag (table créée quand même).';
  end if;
end $$;

-- ================= 1. MIGRATION 012 : extension rôles/permissions ================
-- (user_permissions volontairement NON créée — décision D-02)
alter table public.roles
  add column if not exists is_custom boolean not null default false;

alter table public.roles
  add column if not exists position integer not null default 0;

alter table public.permissions
  add column if not exists scope text not null default 'general';

comment on column public.roles.is_custom is 'true = rôle personnalisé (Edge SUPER_ADMIN), false = canonique seed 003';
comment on column public.permissions.scope is 'Domaine fonctionnel (users, cms, erp, …). Informatif, ne porte pas de sécurité.';

comment on column public.roles.is_custom is 'true = rôle personnalisé (Edge SUPER_ADMIN), false = canonique seed 003';
comment on column public.permissions.scope is 'Domaine fonctionnel (users, cms, erp, …). Informatif, ne porte pas de sécurité.';

-- ================= 2. MIGRATION 013 : feature_flags =============================
create table if not exists public.feature_flags (
  code text primary key,
  name text not null,
  description text not null default '',
  is_enabled boolean not null default true,
  env text not null default 'production' check (env in ('production','staging','dev')),
  target_roles text[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_feature_flags_updated on public.feature_flags;
create trigger trg_feature_flags_updated before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;

drop policy if exists feature_flags_public_read on public.feature_flags;
create policy feature_flags_public_read on public.feature_flags for select
  to anon, authenticated using (is_enabled and env = 'production');

drop policy if exists feature_flags_staff_read on public.feature_flags;
create policy feature_flags_staff_read on public.feature_flags for select
  to authenticated using (public.has_permission('settings.view'));

drop policy if exists feature_flags_staff_write on public.feature_flags;
create policy feature_flags_staff_write on public.feature_flags for all
  to authenticated
  using (public.has_permission('settings.view'))
  with check (public.has_permission('settings.manage'));

grant select on public.feature_flags to anon;
grant select, insert, update, delete on public.feature_flags to authenticated;

insert into public.feature_flags (code, name, description, is_enabled, env)
select
  kv.key,
  initcap(replace(replace(kv.key, 'Enabled', ''), 'Mode', ' Mode')),
  'Migré depuis app_settings.features.defaults (vague A2).',
  (kv.value)::boolean,
  'production'
from public.app_settings s,
lateral jsonb_each_text(s.value) as kv(key, value)
where s.key = 'features.defaults'
on conflict (code) do nothing;

-- ================= 3. MIGRATION 014 : pages CMS, SEO, statuts ==================
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  is_published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pages_updated on public.pages;
create trigger trg_pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

create table if not exists public.seo_meta (
  section_id uuid primary key references public.cms_sections (id) on delete cascade,
  meta_title text not null default '',
  meta_desc text not null default '',
  slug text not null default '',
  og_image text,
  noindex boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- --- Correction F-01 (validée revue 3A) : unicité du slug SEO ---
-- Additive, idempotente (bloc DO + test pg_constraint), non destructive.
-- Effet : deux lignes avec le même slug (y compris '') seront refusées —
-- les slugs doivent être explicites. Aucune ligne existante (table nouvelle).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seo_meta_slug_unique') then
    alter table public.seo_meta add constraint seo_meta_slug_unique unique (slug);
  end if;
end $$;

alter table public.cms_sections
  add column if not exists page_id uuid references public.pages (id) on delete set null;

alter table public.cms_sections
  add column if not exists position integer not null default 0;

alter table public.cms_sections
  add column if not exists scheduled_at timestamptz;

alter table public.cms_sections
  add column if not exists published_by uuid references public.profiles (id) on delete set null;

create index if not exists cms_sections_page_id_idx on public.cms_sections (page_id, position);

alter table public.cms_sections drop constraint if exists cms_sections_status_check;
alter table public.cms_sections
  add constraint cms_sections_status_check
  check (status in ('draft','review','published','archived'));

alter table public.pages enable row level security;
alter table public.seo_meta enable row level security;

drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages for select
  to anon, authenticated using (is_published);

drop policy if exists pages_staff_write on public.pages;
create policy pages_staff_write on public.pages for all
  to authenticated
  using (public.has_permission('cms.view'))
  with check (public.has_permission('cms.update'));

drop policy if exists seo_public_read on public.seo_meta;
create policy seo_public_read on public.seo_meta for select
  to anon, authenticated using (true);

drop policy if exists seo_staff_write on public.seo_meta;
create policy seo_staff_write on public.seo_meta for all
  to authenticated
  using (public.has_permission('cms.view'))
  with check (public.has_permission('cms.update'));

grant select on public.pages, public.seo_meta to anon;
grant select, insert, update, delete on public.pages, public.seo_meta to authenticated;

-- ================= 4. MIGRATION 015 : modèle riche ==============================
alter table public.menus
  add column if not exists display_name text;
alter table public.menus
  add column if not exists module_id uuid references public.modules (id) on delete set null;
alter table public.menus
  add column if not exists badge text;
alter table public.menus
  add column if not exists open_in_new_tab boolean not null default false;

create table if not exists public.menu_permissions (
  menu_id uuid not null references public.menus (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (menu_id, permission_id)
);

alter table public.modules
  add column if not exists visibility text not null default 'staff'
  check (visibility in ('public','client','staff','admin'));
alter table public.modules
  add column if not exists feature_flag text references public.feature_flags (code) on delete set null;
alter table public.modules
  add column if not exists menu_id uuid references public.menus (id) on delete set null;

create table if not exists public.module_dependencies (
  module_id uuid not null references public.modules (id) on delete cascade,
  depends_on_module_id uuid not null references public.modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (module_id, depends_on_module_id),
  check (module_id <> depends_on_module_id)
);

alter table public.form_fields
  add column if not exists help_text text;
alter table public.form_fields
  add column if not exists validation text;
alter table public.form_fields
  add column if not exists section text;
alter table public.form_fields
  add column if not exists visible_roles text[] not null default '{}';

alter table public.form_fields drop constraint if exists form_fields_field_type_check;
alter table public.form_fields
  add constraint form_fields_field_type_check
  check (field_type in ('text','textarea','number','email','phone','date','datetime',
    'select','multiselect','checkbox','radio','file','image','signature','currency',
    'user','department','role','module','client','project'));

alter table public.media_items
  add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.media_items
  add column if not exists owner_profile_id uuid references public.profiles (id) on delete set null;
create index if not exists media_items_owner_idx on public.media_items (owner_profile_id);

alter table public.menu_permissions enable row level security;
alter table public.module_dependencies enable row level security;

drop policy if exists menu_permissions_staff_read on public.menu_permissions;
create policy menu_permissions_staff_read on public.menu_permissions for select
  to authenticated
  using (public.has_permission('menus.view') or public.has_permission('roles.view'));

drop policy if exists module_dependencies_staff_read on public.module_dependencies;
create policy module_dependencies_staff_read on public.module_dependencies for select
  to authenticated
  using (public.has_permission('modules.view'));

grant select on public.menu_permissions, public.module_dependencies to authenticated;

-- ================= 5. VÉRIFICATIONS POST-MIGRATION (lecture seule) ==============
-- Tables nouvelles (attendu : 5 lignes) :
select table_name from information_schema.tables
where table_schema='public'
and table_name in ('feature_flags','pages','seo_meta','menu_permissions','module_dependencies')
order by table_name;

-- RLS activée (attendu : 5 lignes, true partout) :
select tablename, rowsecurity from pg_tables
where schemaname='public'
and tablename in ('feature_flags','pages','seo_meta','menu_permissions','module_dependencies')
order by tablename;

-- Policies présentes (attendu : 9 lignes) :
select policyname from pg_policies
where schemaname='public'
and tablename in ('feature_flags','pages','seo_meta','menu_permissions','module_dependencies')
order by tablename, policyname;

-- Index présents (attendu : au moins cms_sections_page_id_idx, media_items_owner_idx) :
select indexname from pg_indexes
where schemaname='public'
and indexname in ('cms_sections_page_id_idx','media_items_owner_idx')
order by indexname;

-- Contraintes (attendu : 5 lignes) :
select conname from pg_constraint
where conrelid in ('public.feature_flags'::regclass,'public.pages'::regclass,
  'public.seo_meta'::regclass,'public.menu_permissions'::regclass,
  'public.module_dependencies'::regclass,'public.cms_sections'::regclass,
  'public.form_fields'::regclass)
and conname in ('seo_meta_slug_unique','seo_meta_pkey','pages_pkey',
  'menu_permissions_pkey','module_dependencies_pkey','module_dependencies_check',
  'cms_sections_status_check','form_fields_field_type_check')
order by conname;

-- Seeds flags (attendu : 7 lignes si seed 007 présent, sinon 0 — voir NOTICE §0) :
select code, is_enabled, env from public.feature_flags order by code;

-- Slug unique effectif (attendu : 0 doublon) :
select slug, count(*) from public.seo_meta group by slug having count(*) > 1;

-- 25 tables historiques intactes (attendu : 25 lignes) :
select count(*) as tables_historiques from information_schema.tables
where table_schema='public'
and table_name in ('roles','permissions','role_permissions','profiles','cms_sections',
'cms_versions','menus','modules','module_permissions','forms','form_fields',
'form_submissions','media_items','youtube_config','youtube_videos','org_units',
'clients','projects','quotes','quote_items','erp_tasks','erp_transactions',
'cash_closures','audit_logs','app_settings');
