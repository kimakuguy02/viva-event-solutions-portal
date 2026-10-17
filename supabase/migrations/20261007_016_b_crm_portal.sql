-- VIVA — Migration 016 (vague B1) : CRM + portail client (tables)
-- Prérequiss : 001 (helpers, set_updated_at), 004 (clients, quotes, projects).
-- ADDITIF : nouvelles tables uniquement. Auteurs/propriétaires imposés serveur
-- (triggers, même pattern que 010) : jamais de confiance au champ client.

-- ---- Forçage auteur/propriétaire = auth.uid() (sessions authentifiées) ----
create or replace function public.force_owner_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_argv[0] = 'owner_profile_id' then
      new.owner_profile_id := auth.uid();
    elsif tg_argv[0] = 'author_profile_id' then
      new.author_profile_id := auth.uid();
    end if;
    new.created_at := now();
  end if;
  return new;
end;
$$;

-- ================= CONTACTS =================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  role text not null default '',
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_client_idx on public.contacts (client_id);
drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ================= INTERACTIONS CRM =================
create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('appel','email','reunion','whatsapp','visite','note','autre')),
  summary text not null default '',
  next_action text,
  due_at date,
  created_at timestamptz not null default now()
);
create index if not exists crm_interactions_client_idx on public.crm_interactions (client_id, created_at desc);
drop trigger if exists trg_crm_inter_author on public.crm_interactions;
create trigger trg_crm_inter_author before insert on public.crm_interactions
  for each row execute function public.force_owner_author('author_profile_id');

-- ================= DEMANDES CLIENT =================
create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  owner_profile_id uuid not null references public.profiles (id) on delete restrict,
  objet text not null default '',
  service text not null default '',
  description text not null default '',
  status text not null default 'SUBMITTED'
    check (status in ('DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CLOSED')),
  priority text not null default 'normale'
    check (priority in ('basse','normale','haute','urgente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists client_requests_owner_idx on public.client_requests (owner_profile_id, created_at desc);
drop trigger if exists trg_requests_owner on public.client_requests;
create trigger trg_requests_owner before insert on public.client_requests
  for each row execute function public.force_owner_author('owner_profile_id');
drop trigger if exists trg_requests_updated on public.client_requests;
create trigger trg_requests_updated before update on public.client_requests
  for each row execute function public.set_updated_at();

create table if not exists public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests (id) on delete cascade,
  storage_path text not null,
  file_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists request_attachments_request_idx on public.request_attachments (request_id);

-- ================= TICKETS =================
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  owner_profile_id uuid not null references public.profiles (id) on delete restrict,
  sujet text not null default '',
  categorie text not null default 'support',
  priorite text not null default 'normale'
    check (priorite in ('basse','normale','haute','urgente')),
  statut text not null default 'OPEN'
    check (statut in ('OPEN','IN_PROGRESS','WAITING','RESOLVED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tickets_owner_idx on public.tickets (owner_profile_id, created_at desc);
drop trigger if exists trg_tickets_owner on public.tickets;
create trigger trg_tickets_owner before insert on public.tickets
  for each row execute function public.force_owner_author('owner_profile_id');
drop trigger if exists trg_tickets_updated on public.tickets;
create trigger trg_tickets_updated before update on public.tickets
  for each row execute function public.set_updated_at();

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);
drop trigger if exists trg_ticket_msg_author on public.ticket_messages;
create trigger trg_ticket_msg_author before insert on public.ticket_messages
  for each row execute function public.force_owner_author('author_profile_id');

-- ================= DOCUMENTS CLIENT =================
create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles (id) on delete restrict,
  quote_id uuid references public.quotes (id) on delete set null,
  type text not null check (type in ('devis','contrat','facture','rapport','photo','video','autre')),
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists client_documents_owner_idx on public.client_documents (owner_profile_id, created_at desc);
