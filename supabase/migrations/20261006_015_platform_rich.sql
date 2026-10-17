-- VIVA — Migration 015 (vague A4) : modèle riche menus/modules/formulaires/médias
-- Prérequiss : 001, 004 (menus/modules/form_fields/media_items), 013 (feature_flags).
-- ADDITIF : colonnes NULLables + 2 tables de liaison ; CHECK form_fields étendu.

-- ---- Menus ----
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

-- ---- Modules ----
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

-- ---- Champs de formulaire ----
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

-- ---- Médias ----
alter table public.media_items
  add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.media_items
  add column if not exists owner_profile_id uuid references public.profiles (id) on delete set null;
create index if not exists media_items_owner_idx on public.media_items (owner_profile_id);

-- ---- RLS (deny-by-default ; héritage des permissions existantes) ----
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

-- Pas d'écriture publique sur les liaisons : SUPER_ADMIN via service_role/Edge
-- (même régime que role_permissions en 002).

grant select on public.menu_permissions, public.module_dependencies to authenticated;

-- Vérification post-migration :
--   select column_name from information_schema.columns where table_schema='public' and table_name='menus' and column_name in ('display_name','module_id','badge','open_in_new_tab');
--   select column_name from information_schema.columns where table_schema='public' and table_name='modules' and column_name in ('visibility','feature_flag','menu_id');
--   select column_name from information_schema.columns where table_schema='public' and table_name='media_items' and column_name in ('metadata','owner_profile_id');
--   insert test ciblé par table puis delete ciblé (jamais de TRUNCATE).
-- Retour arrière : drop tables menu_permissions/module_dependencies ; drop colonnes
-- ajoutées ; restaurer l'ancien CHECK form_fields (liste d'origine).
