-- VIVA — Migration 019 (vague C1) : projets/ERP étendus + équipements/achats
-- Prérequiss : 001, 004 (projects, erp_tasks, quotes, clients).
-- ADDITIF : nouvelles tables + colonnes NULLables. Aucune donnée touchée.

-- ---- Projets : champs produit ----
alter table public.projects
  add column if not exists priority text not null default 'normale'
  check (priority in ('basse','normale','haute','urgente'));
alter table public.projects
  add column if not exists archived boolean not null default false;
alter table public.projects
  add column if not exists description text not null default '';

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_operationnel text not null default '',
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null default '',
  date date,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','blocked','done','cancelled')),
  priority text not null default 'normale'
    check (priority in ('basse','normale','haute','urgente')),
  created_at timestamptz not null default now()
);
create index if not exists project_milestones_project_idx on public.project_milestones (project_id, date);

create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null default '',
  status text not null default 'pending' check (status in ('pending','ready')),
  url text,
  created_at timestamptz not null default now()
);

-- ---- Tâches : statuts étendus + progression + dépendances ----
alter table public.erp_tasks drop constraint if exists erp_tasks_status_check;
-- NOTE : nom auto-généré supposé depuis 004 ; vérifié au staging (sinon adapter).
alter table public.erp_tasks
  add constraint erp_tasks_status_check
  check (status in ('a_faire','en_cours','revue','termine','bloquee','annulee'));
alter table public.erp_tasks
  add column if not exists progress integer not null default 0 check (progress between 0 and 100);
alter table public.erp_tasks
  add column if not exists depends_on uuid[] not null default '{}';

-- ---- Devis : validité/conditions/acceptation ----
alter table public.quotes
  add column if not exists valid_until date;
alter table public.quotes
  add column if not exists conditions text not null default '';
alter table public.quotes
  add column if not exists accepted_by uuid references public.profiles (id) on delete set null;
alter table public.quotes
  add column if not exists accepted_at timestamptz;
alter table public.quotes
  add column if not exists viewed_at timestamptz;

-- ---- Équipements ----
create table if not exists public.equipment (
  code text primary key,
  name text not null,
  category text not null default '',
  quantity_total integer not null default 0 check (quantity_total >= 0),
  quantity_available integer not null default 0 check (quantity_available >= 0),
  location text not null default '',
  condition text not null default 'excellent',
  daily_rate_usd numeric(14,2) not null default 0 check (daily_rate_usd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_equipment_updated on public.equipment;
create trigger trg_equipment_updated before update on public.equipment
  for each row execute function public.set_updated_at();

create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  equipment_code text not null references public.equipment (code) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  qty integer not null default 1 check (qty > 0),
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz
);
create index if not exists equipment_assignments_project_idx on public.equipment_assignments (project_id);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_code text not null references public.equipment (code) on delete cascade,
  type text not null default '',
  description text not null default '',
  cost_usd numeric(14,2) not null default 0 check (cost_usd >= 0),
  performed_by uuid references public.profiles (id) on delete set null,
  performed_at date not null default current_date,
  next_due date,
  created_at timestamptz not null default now()
);

-- ---- Fournisseurs & achats ----
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company text not null unique,
  category text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  status text not null default 'actif' check (status in ('actif','inactif')),
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  name text not null,
  role text not null default '',
  email text not null default '',
  phone text not null default '',
  notes text not null default ''
);

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  requester_profile_id uuid references public.profiles (id) on delete set null,
  direction text not null default '',
  project_id uuid references public.projects (id) on delete set null,
  justification text not null default '',
  currency text not null default 'USD' check (currency in ('USD','CDF')),
  status text not null default 'draft'
    check (status in ('draft','pending_validation','validated','ordered','delivered','closed','rejected')),
  validator_profile_id uuid references public.profiles (id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists purchase_requests_requester_idx on public.purchase_requests (requester_profile_id);

create table if not exists public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.purchase_requests (id) on delete cascade,
  label text not null,
  quantity numeric(12,3) not null default 1 check (quantity >= 0),
  unit_price_usd numeric(14,2) not null default 0 check (unit_price_usd >= 0)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.purchase_requests (id) on delete restrict,
  supplier_id uuid references public.suppliers (id) on delete set null,
  total_usd numeric(14,2) not null default 0 check (total_usd >= 0),
  status text not null default 'ordered'
    check (status in ('ordered','delivered','closed','cancelled')),
  ordered_at timestamptz not null default now(),
  delivered_at timestamptz,
  closed_at timestamptz
);

-- ---- RLS (deny-by-default ; owner/staff existants) ----
alter table public.project_members enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.purchase_orders enable row level security;

-- Projets liés : membre/lead du projet ou projects.manage.
drop policy if exists project_members_read on public.project_members;
create policy project_members_read on public.project_members for select
  to authenticated using (
    profile_id = auth.uid() or public.has_permission('projects.manage'));
drop policy if exists project_members_write on public.project_members;
create policy project_members_write on public.project_members for all
  to authenticated
  using (public.has_permission('projects.manage'))
  with check (public.has_permission('projects.manage'));

drop policy if exists milestones_read on public.project_milestones;
create policy milestones_read on public.project_milestones for select
  to authenticated using (
    exists (select 1 from public.projects p
      where p.id = project_milestones.project_id
      and (p.lead_profile_id = auth.uid() or public.has_permission('projects.view')))
    or exists (select 1 from public.project_members m
      where m.project_id = project_milestones.project_id and m.profile_id = auth.uid()));
drop policy if exists milestones_write on public.project_milestones;
-- create ne doit pas valoir delete : un preparateur de projet peut porter a jour
-- une etape, l'effacement reste un droit de mise a jour/suppression.
drop policy if exists milestones_staff_insert on public.project_milestones;
create policy milestones_staff_insert on public.project_milestones for insert
  to authenticated with check (public.has_permission('projects.create'));
drop policy if exists milestones_staff_update on public.project_milestones;
create policy milestones_staff_update on public.project_milestones for update
  to authenticated
  using (public.has_permission('projects.update'))
  with check (public.has_permission('projects.update'));
drop policy if exists milestones_staff_delete on public.project_milestones;
create policy milestones_staff_delete on public.project_milestones for delete
  to authenticated using (public.has_permission('projects.delete'));

drop policy if exists deliverables_read on public.project_deliverables;
create policy deliverables_read on public.project_deliverables for select
  to authenticated using (
    exists (select 1 from public.projects p
      where p.id = project_deliverables.project_id
      and (p.lead_profile_id = auth.uid() or public.has_permission('projects.view'))));
drop policy if exists deliverables_write on public.project_deliverables;
drop policy if exists deliverables_staff_insert on public.project_deliverables;
create policy deliverables_staff_insert on public.project_deliverables for insert
  to authenticated with check (public.has_permission('projects.create'));
drop policy if exists deliverables_staff_update on public.project_deliverables;
create policy deliverables_staff_update on public.project_deliverables for update
  to authenticated
  using (public.has_permission('projects.update'))
  with check (public.has_permission('projects.update'));
drop policy if exists deliverables_staff_delete on public.project_deliverables;
create policy deliverables_staff_delete on public.project_deliverables for delete
  to authenticated using (public.has_permission('projects.delete'));

-- Équipements : lecture staff/erp, écriture equipment.manage.
drop policy if exists equipment_read on public.equipment;
create policy equipment_read on public.equipment for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists equipment_write on public.equipment;
create policy equipment_write on public.equipment for all
  to authenticated
  using (public.has_permission('equipment.manage'))
  with check (public.has_permission('equipment.manage'));

drop policy if exists equip_assign_read on public.equipment_assignments;
create policy equip_assign_read on public.equipment_assignments for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists equip_assign_write on public.equipment_assignments;
create policy equip_assign_write on public.equipment_assignments for all
  to authenticated
  using (public.has_permission('equipment.manage'))
  with check (public.has_permission('equipment.manage'));

drop policy if exists maintenance_read on public.maintenance_logs;
create policy maintenance_read on public.maintenance_logs for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists maintenance_write on public.maintenance_logs;
create policy maintenance_write on public.maintenance_logs for all
  to authenticated
  using (public.has_permission('equipment.manage'))
  with check (public.has_permission('equipment.manage'));

-- Fournisseurs/achats : lecture erp.view, écriture erp.create, validation via RPC futur.
drop policy if exists suppliers_read on public.suppliers;
create policy suppliers_read on public.suppliers for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists suppliers_write on public.suppliers;
create policy suppliers_write on public.suppliers for all
  to authenticated
  using (public.has_permission('erp.create'))
  with check (public.has_permission('erp.create'));

drop policy if exists supplier_contacts_read on public.supplier_contacts;
create policy supplier_contacts_read on public.supplier_contacts for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists supplier_contacts_write on public.supplier_contacts;
create policy supplier_contacts_write on public.supplier_contacts for all
  to authenticated
  using (public.has_permission('erp.create'))
  with check (public.has_permission('erp.create'));

drop policy if exists purchases_read on public.purchase_requests;
create policy purchases_read on public.purchase_requests for select
  to authenticated using (
    requester_profile_id = auth.uid() or public.has_permission('erp.view'));
drop policy if exists purchases_write on public.purchase_requests;
create policy purchases_write on public.purchase_requests for insert
  to authenticated with check (public.has_permission('erp.create'));
drop policy if exists purchases_update on public.purchase_requests;
create policy purchases_update on public.purchase_requests for update
  to authenticated
  using (public.has_permission('erp.validate'))
  with check (public.has_permission('erp.validate'));

drop policy if exists purchase_lines_read on public.purchase_lines;
create policy purchase_lines_read on public.purchase_lines for select
  to authenticated using (
    exists (select 1 from public.purchase_requests r
      where r.id = purchase_lines.request_id
      and (r.requester_profile_id = auth.uid() or public.has_permission('erp.view'))));
drop policy if exists purchase_lines_write on public.purchase_lines;
create policy purchase_lines_write on public.purchase_lines for insert
  to authenticated with check (public.has_permission('erp.create'));

drop policy if exists purchase_orders_read on public.purchase_orders;
create policy purchase_orders_read on public.purchase_orders for select
  to authenticated using (public.has_permission('erp.view'));
-- Pas d'écriture directe : Edge/RPC (validation + commande liées).

grant select, insert, update, delete on public.project_members, public.project_milestones, public.project_deliverables to authenticated;
grant select, insert, update, delete on public.equipment, public.equipment_assignments, public.maintenance_logs to authenticated;
grant select, insert, update, delete on public.suppliers, public.supplier_contacts to authenticated;
grant select, insert, update on public.purchase_requests to authenticated;
grant select, insert on public.purchase_lines to authenticated;
grant select on public.purchase_orders to authenticated;

-- Vérification : 11 tables, RLS true, policies présentes, CHECK étendu.
-- Retour arrière : drop tables créées (ordre inverse) ; drop colonnes projets/quotes ;
-- restaurer CHECK erp_tasks d'origine (liste 004).
