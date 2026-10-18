-- VIVA — Migration 017 (vague B2) : notifications + RLS B + Storage client_docs
-- Prérequiss : 001, 002 (helpers), 004, 016. RLS = DENY BY DEFAULT partout.
-- Aucun accès privé via anon. Opérations sensibles = serveur/RPC/Edge.

-- ================= NOTIFICATIONS =================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  categorie text not null check (categorie in ('demande','devis','projet','ticket','systeme','securite')),
  titre text not null default '',
  lien text not null default '',
  priorite text not null default 'normale'
    check (priorite in ('basse','normale','haute','urgente')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_owner_idx on public.notifications (owner_profile_id, created_at desc);

-- Le propriétaire ne peut modifier que read_at (tout le reste = serveur).
create or replace function public.lock_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- service_role / Edge : confiance
  end if;
  if new.id is distinct from old.id
     or new.owner_profile_id is distinct from old.owner_profile_id
     or new.categorie is distinct from old.categorie
     or new.titre is distinct from old.titre
     or new.lien is distinct from old.lien
     or new.priorite is distinct from old.priorite
     or new.created_at is distinct from old.created_at then
    raise exception 'notifications : seul read_at est modifiable par le propriétaire.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notifications_lock on public.notifications;
create trigger trg_notifications_lock before update on public.notifications
  for each row execute function public.lock_notification_update();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  canal text not null check (canal in ('inapp','email','sms','push','whatsapp')),
  status text not null default 'pending'
    check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now()
);
create index if not exists notification_deliveries_notif_idx on public.notification_deliveries (notification_id);

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  categories jsonb not null default '{"inapp": true}'::jsonb,
  canaux jsonb not null default '{"inapp": true}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_notif_prefs_updated on public.notification_preferences;
create trigger trg_notif_prefs_updated before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ================= RLS : activer partout =================
alter table public.contacts enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.client_requests enable row level security;
alter table public.request_attachments enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.client_documents enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_preferences enable row level security;

-- ================= RLS : contacts & interactions (owner du client ou staff) =================
drop policy if exists contacts_owner_staff on public.contacts;
create policy contacts_owner_staff on public.contacts for select
  to authenticated using (
    exists (select 1 from public.clients c
      where c.id = contacts.client_id and c.owner_profile_id = auth.uid())
    or public.has_permission('erp.view')
  );
drop policy if exists contacts_staff_write on public.contacts;
create policy contacts_staff_write on public.contacts for insert
  to authenticated with check (public.has_permission('erp.create'));
drop policy if exists contacts_staff_update on public.contacts;
create policy contacts_staff_update on public.contacts for update
  to authenticated
  using (public.has_permission('erp.update'))
  with check (public.has_permission('erp.update'));

drop policy if exists interactions_owner_staff on public.crm_interactions;
create policy interactions_owner_staff on public.crm_interactions for select
  to authenticated using (
    exists (select 1 from public.clients c
      where c.id = crm_interactions.client_id and c.owner_profile_id = auth.uid())
    or public.has_permission('erp.view')
  );
drop policy if exists interactions_staff_write on public.crm_interactions;
create policy interactions_staff_write on public.crm_interactions for insert
  to authenticated with check (public.has_permission('erp.create'));

-- ================= RLS : demandes (propriétaire forcé, staff erp) =================
drop policy if exists requests_owner_staff on public.client_requests;
create policy requests_owner_staff on public.client_requests for select
  to authenticated using (
    owner_profile_id = auth.uid() or public.has_permission('erp.view')
  );
drop policy if exists requests_insert on public.client_requests;
-- Le trigger 016 force deja owner_profile_id ; la policy le verrouille aussi, pour
-- que la propriete tienne meme si le trigger saute.
create policy requests_insert on public.client_requests for insert
  to authenticated with check (owner_profile_id = auth.uid());
drop policy if exists requests_update on public.client_requests;
-- Le default 016 est « SUBMITTED », pas « DRAFT » : l'ancienne clause laissait un
-- client sans aucun moyen de modifier ou retirer SA propre demande.
create policy requests_update on public.client_requests for update
  to authenticated
  using ((owner_profile_id = auth.uid() and status in ('DRAFT','SUBMITTED')) or public.has_permission('erp.update'))
  with check ((owner_profile_id = auth.uid() and status in ('DRAFT','SUBMITTED')) or public.has_permission('erp.update'));

drop policy if exists req_attachments_read on public.request_attachments;
create policy req_attachments_read on public.request_attachments for select
  to authenticated using (
    exists (select 1 from public.client_requests r
      where r.id = request_attachments.request_id
      and (r.owner_profile_id = auth.uid() or public.has_permission('erp.view')))
  );
drop policy if exists req_attachments_write on public.request_attachments;
create policy req_attachments_write on public.request_attachments for insert
  to authenticated with check (
    exists (select 1 from public.client_requests r
      where r.id = request_attachments.request_id
      and (r.owner_profile_id = auth.uid() or public.has_permission('erp.create')))
  );

-- ================= RLS : tickets & messages =================
drop policy if exists tickets_owner_staff on public.tickets;
create policy tickets_owner_staff on public.tickets for select
  to authenticated using (
    owner_profile_id = auth.uid() or public.has_permission('erp.view')
  );
drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert
  to authenticated with check (owner_profile_id = auth.uid());
drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets for update
  to authenticated using (
    owner_profile_id = auth.uid() or public.has_permission('erp.update')
  )
  with check (
    owner_profile_id = auth.uid() or public.has_permission('erp.update')
  );

drop policy if exists ticket_messages_read on public.ticket_messages;
create policy ticket_messages_read on public.ticket_messages for select
  to authenticated using (
    exists (select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
      and (t.owner_profile_id = auth.uid() or public.has_permission('erp.view')))
  );
drop policy if exists ticket_messages_write on public.ticket_messages;
create policy ticket_messages_write on public.ticket_messages for insert
  to authenticated with check (
    exists (select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
      and (t.owner_profile_id = auth.uid() or public.has_permission('erp.create')))
  );

-- ================= RLS : documents (staff upload, owner lecture) =================
drop policy if exists client_documents_read on public.client_documents;
create policy client_documents_read on public.client_documents for select
  to authenticated using (
    owner_profile_id = auth.uid() or public.has_permission('erp.view')
  );
drop policy if exists client_documents_write on public.client_documents;
create policy client_documents_write on public.client_documents for insert
  to authenticated with check (public.has_permission('erp.create'));

-- ================= RLS : notifications (écriture serveur, lecture owner) =================
drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read on public.notifications for select
  to authenticated using (owner_profile_id = auth.uid());
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications for update
  to authenticated
  using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());
-- Pas d'INSERT/DELETE public : Edge/service_role uniquement.

drop policy if exists notif_deliveries_owner_read on public.notification_deliveries;
create policy notif_deliveries_owner_read on public.notification_deliveries for select
  to authenticated using (
    exists (select 1 from public.notifications n
      where n.id = notification_deliveries.notification_id and n.owner_profile_id = auth.uid())
  );

drop policy if exists notif_prefs_owner on public.notification_preferences;
create policy notif_prefs_owner on public.notification_preferences for select
  to authenticated using (profile_id = auth.uid());
drop policy if exists notif_prefs_owner_write on public.notification_preferences;
create policy notif_prefs_owner_write on public.notification_preferences for insert
  to authenticated with check (profile_id = auth.uid());
drop policy if exists notif_prefs_owner_update on public.notification_preferences;
create policy notif_prefs_owner_update on public.notification_preferences for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ================= Vue timeline (RLS des tables via security_invoker) =================
-- created_at et id existent sur crm_interactions ET sur clients : non qualifies,
-- la vue levait « 42702 column reference is ambiguous », ce qui faisait rouler
-- 017 AU ENTIER (notifications, 10 policies B2, GRANTs, bucket client_docs).
create or replace view public.v_client_timeline
with (security_invoker = true) as
select c.owner_profile_id as owner, crm_interactions.created_at,
  'interaction'::text as source,
  crm_interactions.id::text as ref, crm_interactions.summary as label
  from public.crm_interactions
  join public.clients c on c.id = crm_interactions.client_id
union all
select submitted_by, created_at, 'devis', reference_number, event_name
  from public.quotes where submitted_by is not null
union all
select owner_profile_id, created_at, 'demande', reference, objet
  from public.client_requests
union all
select owner_profile_id, created_at, 'ticket', reference, sujet
  from public.tickets;

-- Les « alter default privileges ... on tables » ne couvrent pas les vues : sans
-- GRANT explicite, toute lecture de v_client_timeline repond 42501.
grant select on public.v_client_timeline to authenticated;

-- ================= GRANTs (RLS filtre ensuite ; anon : rien) =================
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert on public.crm_interactions to authenticated;
grant select, insert, update on public.client_requests to authenticated;
grant select, insert on public.request_attachments to authenticated;
grant select, insert, update on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert on public.client_documents to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.notification_deliveries to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ================= Storage : bucket client_docs (privé) =================
insert into storage.buckets (id, name, public) values
  ('client_docs', 'client_docs', false)
on conflict (id) do update set public = excluded.public;

-- Depôt : le chemin porte l'uid du déposant en 1er segment. Sans ce predicat,
-- n'importe quel CLIENT pouvait ecrire (et donc Precharger/emballer) dans le
-- dossier d'un autre client.
drop policy if exists storage_client_docs_upload on storage.objects;
create policy storage_client_docs_upload on storage.objects for insert
  to authenticated with check (
    bucket_id = 'client_docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture : propriétaire du dossier ou staff. quotes.view est exclu : le rôle
-- CLIENT le possède (003:194), ce qui exposait les contrats, factures et pièces
-- d'identité de tous les autres clients à n'importe quel client connecté.
-- erp.view est conservé : CLIENT ne le possède pas, le secrétariat en a besoin.
drop policy if exists storage_client_docs_read on storage.objects;
create policy storage_client_docs_read on storage.objects for select
  to authenticated using (
    bucket_id = 'client_docs'
    and ((storage.foldername(storage.objects.name))[1] = auth.uid()::text
      or public.has_permission('erp.view')
      or public.has_permission('quotes.manage'))
  );

-- Suppression : le déposant dans son dossier, sinon un droit de gestion.
-- erp.create (droit de dépôt) ne doit pas suffire à effacer les pièces d'autrui.
drop policy if exists storage_client_docs_delete on storage.objects;
create policy storage_client_docs_delete on storage.objects for delete
  to authenticated using (
    bucket_id = 'client_docs'
    and ((storage.foldername(storage.objects.name))[1] = auth.uid()::text
      or public.has_permission('erp.validate'))
  );

-- Vérification post-migration (extraits ; détail complet en TESTS) :
--   tables : contacts, crm_interactions, client_requests, request_attachments,
--     tickets, ticket_messages, client_documents, notifications,
--     notification_deliveries, notification_preferences (+ vue v_client_timeline)
--   bucket client_docs privé.
-- Retour arrière : drop view v_client_timeline ; drop tables dans l'ordre inverse
-- (deliveries, prefs, documents, messages, tickets, attachments, requests,
-- interactions, contacts, notifications) ; delete from storage.buckets id='client_docs'.
