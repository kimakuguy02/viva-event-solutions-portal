-- VIVA EVENT SOLUTIONS — Migration 001 : socle RBAC (tables + contraintes + index)
-- Source de vérité cible : Supabase/PostgreSQL. Firebase/Express/JSON inchangés (PHASE 1).
-- Principes : UUID v4 côté PG (gen_random_uuid), ON CONFLICT idempotent côté seeds,
-- aucune donnée métier ici, uniquement la structure auth/profiles/roles/permissions.

-- Extension pour gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE roles — code canonique UNIQUE (cf. analyse § rôles)
-- ============================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_code_format check (code ~ '^[A-Z0-9_]{3,40}$')
);

-- ============================================================
-- TABLE permissions — code stable compatible SYSTEM_PERMISSIONS existants
-- (users.view, content.update, quotes.manage, ... conservés tels quels)
-- ============================================================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  module text not null default 'general',
  created_at timestamptz not null default now(),
  constraint permissions_code_format check (code ~ '^[a-z0-9_.]{3,60}$')
);

-- ============================================================
-- TABLE profiles — 1 profil par auth.users.id, rôle via role_id (jamais texte libre)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role_id uuid not null references public.roles (id) on delete restrict,
  status text not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_check check (status in ('active', 'suspended', 'invited')),
  constraint profiles_email_check check (char_length(email) between 3 and 150)
);
create index if not exists profiles_role_id_idx on public.profiles (role_id);
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists profiles_status_idx on public.profiles (status);

-- ============================================================
-- TABLE role_permissions — matrice RBAC
-- ============================================================
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);
create index if not exists role_permissions_permission_idx on public.role_permissions (permission_id);

-- ============================================================
-- Trigger updated_at générique (aucune logique métier)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
