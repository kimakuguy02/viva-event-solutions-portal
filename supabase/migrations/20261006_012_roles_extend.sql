-- VIVA — Migration 012 (vague A1) : extension rôles/permissions
-- ADDITIF uniquement. Prérequiss : 001, 003.
-- user_permissions : NON créée (décision D-02 verrouillée).

alter table public.roles
  add column if not exists is_custom boolean not null default false;

alter table public.roles
  add column if not exists position integer not null default 0;

alter table public.permissions
  add column if not exists scope text not null default 'general';

comment on column public.roles.is_custom is 'true = rôle personnalisé (Edge SUPER_ADMIN), false = canonique seed 003';
comment on column public.permissions.scope is 'Domaine fonctionnel (users, cms, erp, …). Informatif, ne porte pas de sécurité.';

-- Vérification post-migration :
--   select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name in ('roles','permissions')
--   order by table_name, ordinal_position;
-- Retour arrière : alter table ... drop column is_custom / position / scope.
