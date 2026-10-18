-- VIVA — Migration 021 (vague D) : workflows, IA, sync, audit étendu, org liens
-- Prérequiss : 001, 002, 004. ADDITIF. Aucune donnée touchée.

-- ---- Workflows ----
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  key text not null,
  label text not null default '',
  responsible_role text not null default '',
  due_days integer not null default 0 check (due_days >= 0),
  position integer not null default 0,
  unique (workflow_id, key)
);

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete restrict,
  subject_type text not null default '',
  subject_id text not null default '',
  current_step text not null default '',
  status text not null default 'running'
    check (status in ('running','completed','cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists workflow_instances_subject_idx on public.workflow_instances (subject_type, subject_id);

create table if not exists public.workflow_transitions (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.workflow_instances (id) on delete cascade,
  from_step text not null default '',
  to_step text not null default '',
  actor_profile_id uuid references public.profiles (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_links (
  id uuid primary key default gen_random_uuid(),
  module text not null default '',
  entity text not null default '',
  entity_id text not null default '',
  instance_id uuid references public.workflow_instances (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.form_workflows (
  form_id uuid not null references public.forms (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete restrict,
  initial_step text not null default '',
  sla_days integer not null default 0 check (sla_days >= 0),
  primary key (form_id, workflow_id)
);

-- ---- IA ----
create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid references public.profiles (id) on delete set null,
  kind text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed'
    check (status in ('proposed','confirmed','rejected','executed')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_actions_requester_idx on public.ai_actions (requester_profile_id, created_at desc);

-- ---- Sécurité / Sync / Audit étendu ----
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null default '',
  actor_profile_id uuid references public.profiles (id) on delete set null,
  detail text not null default '',
  level text not null default 'info' check (level in ('info','warning','critical')),
  created_at timestamptz not null default now()
);
create index if not exists security_events_level_idx on public.security_events (level, created_at desc);

create table if not exists public.sync_operations (
  operation_id text primary key,
  entity text not null default '',
  entity_id text not null default '',
  operation text not null default '' check (operation in ('create','update','archive','delete')),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','applied','conflict','failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  error text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
  add column if not exists before jsonb not null default '{}'::jsonb;
alter table public.audit_logs
  add column if not exists after jsonb not null default '{}'::jsonb;

create table if not exists public.org_memberships (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  unit_id uuid not null references public.org_units (id) on delete cascade,
  is_manager boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (profile_id, unit_id)
);

create table if not exists public.org_unit_modules (
  unit_id uuid not null references public.org_units (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (unit_id, module_id)
);

-- ---- RLS (deny-by-default) ----
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_instances enable row level security;
alter table public.workflow_transitions enable row level security;
alter table public.workflow_links enable row level security;
alter table public.form_workflows enable row level security;
alter table public.ai_actions enable row level security;
alter table public.security_events enable row level security;
alter table public.sync_operations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_unit_modules enable row level security;

-- Définition workflows : SUPER_ADMIN via Edge (lecture staff forms).
drop policy if exists workflows_read on public.workflows;
create policy workflows_read on public.workflows for select
  to authenticated using (public.has_permission('forms.view'));
drop policy if exists workflow_steps_read on public.workflow_steps;
create policy workflow_steps_read on public.workflow_steps for select
  to authenticated using (public.has_permission('forms.view'));
drop policy if exists form_workflows_read on public.form_workflows;
create policy form_workflows_read on public.form_workflows for select
  to authenticated using (public.has_permission('forms.view'));

-- Instances/transitions : créateur + staff forms.
drop policy if exists wf_instances_access on public.workflow_instances;
create policy wf_instances_access on public.workflow_instances for select
  to authenticated using (
    created_by = auth.uid() or public.has_permission('forms.view'));
drop policy if exists wf_instances_insert on public.workflow_instances;
create policy wf_instances_insert on public.workflow_instances for insert
  to authenticated with check (public.has_permission('forms.view'));
drop policy if exists wf_transitions_access on public.workflow_transitions;
create policy wf_transitions_access on public.workflow_transitions for select
  to authenticated using (public.has_permission('forms.view'));
-- Transitions écrites par le moteur (Edge) ; pas d'écriture directe.

-- IA : demandeur lit les siennes, staff audit lit tout ce qu'il peut.
drop policy if exists ai_own on public.ai_actions;
create policy ai_own on public.ai_actions for select
  to authenticated using (
    requester_profile_id = auth.uid() or public.has_permission('audit.view'));
drop policy if exists ai_insert on public.ai_actions;
-- with check (true) faisait de cette table une boite aux lettres libre : n'importe
-- quel compte authentifie pouvait se presenter comme un autre demandeur.
create policy ai_insert on public.ai_actions for insert
  to authenticated with check (requester_profile_id = auth.uid());

-- Sécurité : lecture audit.view.
drop policy if exists sec_read on public.security_events;
create policy sec_read on public.security_events for select
  to authenticated using (public.has_permission('audit.view'));

-- Sync : propriétaire de l'opération (actor) ou staff.
drop policy if exists sync_own on public.sync_operations;
create policy sync_own on public.sync_operations for select
  to authenticated using (
    actor_profile_id = auth.uid() or public.has_permission('erp.view'));
drop policy if exists sync_insert on public.sync_operations;
create policy sync_insert on public.sync_operations for insert
  to authenticated with check (actor_profile_id = auth.uid());

-- workflow_links etait RLS-on SANS aucune policy : invisible pour tous les roles,
-- y compris SUPER_ADMIN (deny by default). Table de jointure engine/metier, pas de
-- colonne proprietaire : la frontieres'est pose sur le droit de suivre les formulaires.
drop policy if exists wf_links_read on public.workflow_links;
create policy wf_links_read on public.workflow_links for select
  to authenticated using (public.has_permission('forms.view'));
drop policy if exists wf_links_insert on public.workflow_links;
create policy wf_links_insert on public.workflow_links for insert
  to authenticated with check (public.has_permission('forms.view'));
drop policy if exists wf_links_delete on public.workflow_links;
create policy wf_links_delete on public.workflow_links for delete
  to authenticated using (public.has_permission('forms.update'));

-- Org liens : lecture organisation, écriture organization.manage.
drop policy if exists org_members_read on public.org_memberships;
create policy org_members_read on public.org_memberships for select
  to authenticated using (public.has_permission('organization.view'));
drop policy if exists org_members_write on public.org_memberships;
create policy org_members_write on public.org_memberships for all
  to authenticated
  using (public.has_permission('organization.manage'))
  with check (public.has_permission('organization.manage'));
drop policy if exists org_mods_read on public.org_unit_modules;
create policy org_mods_read on public.org_unit_modules for select
  to authenticated using (public.has_permission('organization.view'));
drop policy if exists org_mods_write on public.org_unit_modules;
create policy org_mods_write on public.org_unit_modules for all
  to authenticated
  using (public.has_permission('organization.manage'))
  with check (public.has_permission('organization.manage'));

grant select on public.workflows, public.workflow_steps, public.form_workflows to authenticated;
grant select, insert on public.workflow_instances to authenticated;
grant select on public.workflow_transitions, public.workflow_links to authenticated;
grant select, insert on public.ai_actions to authenticated;
grant select on public.security_events to authenticated;
grant select, insert on public.sync_operations to authenticated;
grant select, insert, update, delete on public.org_memberships, public.org_unit_modules to authenticated;

-- Vérification : 11 tables + 2 colonnes audit, RLS true, policies présentes.
-- Retour arrière : drop tables dans l'ordre inverse des dépendances ; drop
-- colonnes audit (before/after) ; workflows en dernier (référencés).
