-- CHANTIER 2 — 004 : schéma métier (tables + contraintes + index)
-- Dérivé du code réel : types/cmsAndErp.ts, types/erp.ts, types/index.ts,
-- ProjectDataContext, EnterpriseErpContext, cmsAndErpDefaults, vivaData.
-- UUID PG partout. Aucune donnée métier. Firebase/Express/React intacts.

-- ================= CMS =================
create table if not exists public.cms_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  category text not null default 'GENERAL',
  section text not null default '',
  component text not null default '',
  content_key text not null unique,
  title text not null default '',
  subtitle text,
  content text not null default '',
  primary_button_text text,
  secondary_button_text text,
  field_type text not null default 'text'
    check (field_type in ('text','html','image_url','slogan','button_label','compound')),
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  language text not null default 'fr' check (language in ('fr','en')),
  author_profile_id uuid references public.profiles (id) on delete set null,
  author_label text not null default '',
  published_title text, published_subtitle text, published_content text,
  published_primary_button_text text, published_secondary_button_text text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cms_sections_page_idx on public.cms_sections (page);
create index if not exists cms_sections_status_idx on public.cms_sections (status);

create table if not exists public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_sections (id) on delete cascade,
  version_label text not null default '',
  title text not null default '',
  content text not null default '',
  old_value text, new_value text,
  author_profile_id uuid references public.profiles (id) on delete set null,
  author_label text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists cms_versions_section_idx on public.cms_versions (section_id, created_at desc);

-- ================= MENUS (hiérarchique) =================
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.menus (id) on delete cascade,
  code text not null unique,
  label text not null,
  route text not null default '',
  icon text not null default '',
  position integer not null default 0,
  is_active boolean not null default true,
  show_in_navbar boolean not null default true,
  visibility text not null default 'public'
    check (visibility in ('public','client','staff','admin')),
  required_permission text references public.permissions (code) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists menus_parent_idx on public.menus (parent_id, position);

-- ================= MODULES =================
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default '',
  route text not null default '',
  category text not null default 'management',
  is_active boolean not null default true,
  archived boolean not null default false,
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.module_permissions (
  module_id uuid not null references public.modules (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (module_id, permission_id)
);

-- ================= FORMULAIRES =================
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  target_audience text not null default 'public'
    check (target_audience in ('public','client','staff','admin')),
  status text not null default 'actif'
    check (status in ('actif','inactif','archive')),
  submissions_count integer not null default 0 check (submissions_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  name text not null,
  label text not null,
  field_type text not null
    check (field_type in ('text','textarea','number','email','phone','date','datetime',
      'select','multiselect','checkbox','radio','file','image','signature','currency','user','department','role')),
  placeholder text,
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (form_id, name)
);
create index if not exists form_fields_form_idx on public.form_fields (form_id, position);
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  submitted_by uuid references public.profiles (id) on delete set null,
  submitted_email text not null default '',
  submitted_name text not null default '',
  status text not null default 'soumis'
    check (status in ('soumis','en_traitement','approuve','rejete')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists form_submissions_form_idx on public.form_submissions (form_id, created_at desc);

-- ================= MÉDIAS / YOUTUBE =================
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null default '',
  public_url text not null default '',
  thumbnail_url text,
  media_type text not null check (media_type in ('photo','video_file','youtube')),
  title text not null default '',
  description text not null default '',
  category text not null default 'general',
  youtube_video_id text,
  project_id uuid,
  is_featured boolean not null default false,
  position integer not null default 0,
  visibility text not null default 'public' check (visibility in ('public','client','staff')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_items_status_idx on public.media_items (status, visibility, position);

create table if not exists public.youtube_config (
  id text primary key default 'main',
  channel_url text not null default '',
  channel_id text not null default '',
  channel_name text not null default '',
  channel_description text not null default '',
  is_enabled boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  url text not null default '',
  title text not null default '',
  description text not null default '',
  thumbnail_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  position integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ================= ORGANISATION dynamique =================
create table if not exists public.org_units (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.org_units (id) on delete cascade,
  code text not null unique,
  name text not null,
  description text not null default '',
  unit_type text not null check (unit_type in ('direction','sous_direction','departement','service','bureau','poste')),
  manager_profile_id uuid references public.profiles (id) on delete set null,
  manager_name text, manager_email text, manager_phone text, photo_url text,
  location text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists org_units_parent_idx on public.org_units (parent_id, position);

-- ================= CRM / PROJETS / DEVIS =================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  organization text not null default '',
  category text not null default 'entreprise'
    check (category in ('particulier','entreprise','institution','partenaire','prospect',
      'institutionnel','diplomatique','grande_entreprise','pme','particulier_vip')),
  status text not null default 'prospect'
    check (status in ('prospect','devis_en_cours','client_actif','fidelise')),
  email text not null default '', phone text not null default '',
  city text not null default '',
  owner_profile_id uuid references public.profiles (id) on delete set null,
  total_revenue_usd numeric(14,2) not null default 0 check (total_revenue_usd >= 0),
  contracts_count integer not null default 0 check (contracts_count >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_owner_idx on public.clients (owner_profile_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  client_id uuid references public.clients (id) on delete set null,
  client_label text not null default '',
  event_type text not null default '',
  location text not null default '',
  start_date date, end_date date,
  budget_usd numeric(14,2) not null default 0 check (budget_usd >= 0),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  status text not null default 'conception'
    check (status in ('conception','retroplanning','en_cours','cloture','archive')),
  lead_profile_id uuid references public.profiles (id) on delete set null,
  lead_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  client_name text not null default '', client_email text not null default '',
  event_name text not null default '', event_date date, location text not null default '',
  attendees integer not null default 0 check (attendees >= 0),
  currency text not null default 'USD' check (currency in ('USD','CDF')),
  subtotal_usd numeric(14,2) not null default 0 check (subtotal_usd >= 0),
  discount_usd numeric(14,2) not null default 0 check (discount_usd >= 0),
  total_usd numeric(14,2) not null default 0 check (total_usd >= 0),
  status text not null default 'submitted'
    check (status in ('submitted','under_review','quote_issued','approved','rejected','en_attente_acompte')),
  valid_until date,
  submitted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_client_idx on public.quotes (client_id, created_at desc);
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  label text not null, quantity numeric(12,3) not null default 1 check (quantity >= 0),
  unit_price_usd numeric(14,2) not null default 0 check (unit_price_usd >= 0),
  position integer not null default 0
);
create index if not exists quote_items_quote_idx on public.quote_items (quote_id, position);

-- ================= ERP (préparé, non migré) =================
create table if not exists public.erp_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  project_code text not null default '',
  title text not null,
  description text not null default '',
  assigned_to uuid references public.profiles (id) on delete set null,
  priority text not null default 'normale' check (priority in ('basse','normale','haute','urgente')),
  status text not null default 'a_faire' check (status in ('a_faire','en_cours','revue','termine')),
  deadline date, completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.erp_transactions (
  id uuid primary key default gen_random_uuid(),
  piece_reference text not null unique,
  entry_date date not null default current_date,
  direction text not null check (direction in ('recette','depense')),
  category text not null default '',
  account_code text not null default '',
  description text not null default '',
  amount_usd numeric(14,2) not null check (amount_usd >= 0),
  amount_cdf numeric(16,2) not null default 0 check (amount_cdf >= 0),
  payment_account text not null default '',
  counterparty text not null default '',
  performed_by uuid references public.profiles (id) on delete set null,
  requires_double_signature boolean not null default false,
  validation_status text not null default 'en_attente_manager'
    check (validation_status in ('valide','en_attente_manager','en_attente_otp_daf','rejete')),
  manager_approved_by uuid references public.profiles (id) on delete set null,
  daf_validated_by uuid references public.profiles (id) on delete set null,
  daf_validated_at timestamptz,
  -- Ecriture liee lors d'une contrepassation (018.erp_reverse_tx). Declaree ici :
  -- 011 a besoin de la column pour distinguer une contrepassation legitime d'une
  -- ecriteure « valide » saisie a la main, et 011 tourne avant 018.
  reversed_by uuid references public.erp_transactions (id) on delete set null,
  attachment_path text,
  created_at timestamptz not null default now()
);
create index if not exists erp_transactions_status_idx on public.erp_transactions (validation_status, entry_date desc);
create table if not exists public.cash_closures (
  id uuid primary key default gen_random_uuid(),
  closure_date date not null,
  currency text not null check (currency in ('USD','CDF')),
  theoretical_balance numeric(16,2) not null default 0,
  counted_balance numeric(16,2) not null default 0,
  discrepancy numeric(16,2) not null default 0,
  justification text,
  closed_by uuid references public.profiles (id) on delete set null,
  pv_reference text not null default '',
  status text not null default 'conforme',
  created_at timestamptz not null default now(),
  unique (closure_date, currency)
);

-- ================= AUDIT append-only (structure) =================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource text not null default '',
  resource_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  result text not null default 'success' check (result in ('success','failure','denied')),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource, created_at desc);

-- ================= PARAMÈTRES (branding/flags/config) =================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  category text not null default 'general'
    check (category in ('general','branding','finance','features','contact')),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Triggers updated_at
drop trigger if exists trg_cms_sections_updated on public.cms_sections;
create trigger trg_cms_sections_updated before update on public.cms_sections
  for each row execute function public.set_updated_at();
drop trigger if exists trg_menus_updated on public.menus;
create trigger trg_menus_updated before update on public.menus
  for each row execute function public.set_updated_at();
drop trigger if exists trg_modules_updated on public.modules;
create trigger trg_modules_updated before update on public.modules
  for each row execute function public.set_updated_at();
drop trigger if exists trg_forms_updated on public.forms;
create trigger trg_forms_updated before update on public.forms
  for each row execute function public.set_updated_at();
drop trigger if exists trg_org_units_updated on public.org_units;
create trigger trg_org_units_updated before update on public.org_units
  for each row execute function public.set_updated_at();
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists trg_quotes_updated on public.quotes;
create trigger trg_quotes_updated before update on public.quotes
  for each row execute function public.set_updated_at();
drop trigger if exists trg_erp_tasks_updated on public.erp_tasks;
create trigger trg_erp_tasks_updated before update on public.erp_tasks
  for each row execute function public.set_updated_at();
