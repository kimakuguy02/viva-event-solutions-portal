-- VIVA — Migration 013 (vague A2) : feature flags en table dédiée
-- Prérequiss : 001 (set_updated_at), 004 (app_settings avec features.defaults).
-- Copie (pas de suppression) : app_settings.features.defaults reste intact.

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

-- Lecture : flags actifs de production lisibles (l'UI filtre is_enabled) ;
-- le reste exige settings.view. Écriture : settings.manage.
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

-- Migration des 7 flags depuis app_settings (idempotente, sans suppression source).
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

-- Vérification post-migration :
--   select code, is_enabled, env from public.feature_flags order by code;
--   (attendu : 7 lignes — quotesEnabled, liveHubEnabled, ticketingEnabled,
--    votingEnabled, clientPortalEnabled, visitorRadarEnabled, maintenanceMode)
-- Retour arrière : drop table public.feature_flags (app_settings intact).
