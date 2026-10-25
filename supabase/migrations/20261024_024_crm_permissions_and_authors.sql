-- 024 — CRM opérationnel : permissions dédiées + traçabilité de l'auteur
--
-- Constat vérifié : les policies CRM de 005/017 ne s'appuient que sur
-- erp.view / erp.create / erp.update. Or le seed 003 ne donne pas erp.create
-- à COMMERCIAL_SECRETAIRE (rôle CRM principal) ni erp.view à ADMIN_RH.
-- Résultat : le module CRM ne pouvait pas écrire en base pour ces rôles.
--
-- Cette migration n'invente aucun rôle : elle ajoute uniquement les trois
-- permissions nécessaires au module crm déjà autorisé dans src/utils/rbac.ts
-- (dg_gerant, admin_rh, commercial_secretaire, daf_comptable, admin,
-- admin_general) et étend les policies existantes de façon additive.
-- Les permissions erp.* restent valables : aucun droit existant n'est retiré.
--
-- NON APPLIQUÉE À DISTANCE. À exécuter uniquement sur autorisation explicite.

-- ============================================================
-- 1. Permissions CRM dédiées
-- ============================================================
insert into public.permissions (code, name, description, module) values
  ('crm.view',   'Consulter le CRM',  'Lire les clients, contacts et interactions CRM.', 'crm'),
  ('crm.create', 'Créer dans le CRM', 'Créer des clients, contacts et interactions CRM.', 'crm'),
  ('crm.update', 'Modifier le CRM',   'Mettre à jour les fiches clients et leurs statuts.', 'crm')
on conflict (code) do nothing;

-- Attribution aux six rôles qui ont déjà accès au module CRM dans l'UI.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in (
    'SUPER_ADMIN',
    'ADMIN_GENERAL',
    'DG_GERANT',
    'ADMIN_RH',
    'DAF_COMPTABLE',
    'COMMERCIAL_SECRETAIRE'
  )
  and p.code in ('crm.view', 'crm.create', 'crm.update')
on conflict do nothing;

-- ============================================================
-- 2. Clients — lecture / création / mise à jour
-- ============================================================
drop policy if exists clients_staff_read on public.clients;
create policy clients_staff_read on public.clients for select to authenticated
  using (
    owner_profile_id = auth.uid()
    or public.has_permission('erp.view')
    or public.has_permission('crm.view')
  );

drop policy if exists clients_staff_insert on public.clients;
create policy clients_staff_insert on public.clients for insert to authenticated
  with check (
    public.has_permission('erp.create')
    or public.has_permission('crm.create')
  );

drop policy if exists clients_staff_update on public.clients;
create policy clients_staff_update on public.clients for update to authenticated
  using (
    public.has_permission('erp.update')
    or public.has_permission('crm.update')
  )
  with check (
    public.has_permission('erp.update')
    or public.has_permission('crm.update')
  );

-- ============================================================
-- 3. Contacts — lecture / création / mise à jour
-- ============================================================
drop policy if exists contacts_owner_staff on public.contacts;
create policy contacts_owner_staff on public.contacts for select to authenticated
  using (
    exists (select 1 from public.clients c
      where c.id = contacts.client_id and c.owner_profile_id = auth.uid())
    or public.has_permission('erp.view')
    or public.has_permission('crm.view')
  );

drop policy if exists contacts_staff_write on public.contacts;
create policy contacts_staff_write on public.contacts for insert to authenticated
  with check (
    public.has_permission('erp.create')
    or public.has_permission('crm.create')
  );

drop policy if exists contacts_staff_update on public.contacts;
create policy contacts_staff_update on public.contacts for update to authenticated
  using (
    public.has_permission('erp.update')
    or public.has_permission('crm.update')
  )
  with check (
    public.has_permission('erp.update')
    or public.has_permission('crm.update')
  );

-- ============================================================
-- 4. Interactions — lecture / écriture + libellé auteur
-- ============================================================
drop policy if exists interactions_owner_staff on public.crm_interactions;
create policy interactions_owner_staff on public.crm_interactions for select to authenticated
  using (
    exists (select 1 from public.clients c
      where c.id = crm_interactions.client_id and c.owner_profile_id = auth.uid())
    or public.has_permission('erp.view')
    or public.has_permission('crm.view')
  );

drop policy if exists interactions_staff_write on public.crm_interactions;
create policy interactions_staff_write on public.crm_interactions for insert to authenticated
  with check (
    public.has_permission('erp.create')
    or public.has_permission('crm.create')
  );

-- Le trigger 016 force author_profile_id = auth.uid(). Ce second trigger
-- recopie le nom affichable, pour que les autres collaborateurs voient
-- l'auteur réel sans dépendre de la policy de lecture des profils.
alter table public.crm_interactions
  add column if not exists author_label text not null default '';

create or replace function public.set_crm_interaction_author_label()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_profile_id is not null then
    select coalesce(nullif(p.full_name, ''), p.email)
      into new.author_label
      from public.profiles p
      where p.id = new.author_profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_crm_inter_author_label on public.crm_interactions;
create trigger trg_crm_inter_author_label
  before insert or update of author_profile_id on public.crm_interactions
  for each row execute function public.set_crm_interaction_author_label();

-- Reprise des échanges déjà consignés (aucune suppression, aucune invention).
update public.crm_interactions ci
set author_label = coalesce(nullif(p.full_name, ''), p.email)
from public.profiles p
where ci.author_profile_id = p.id
  and ci.author_label = '';
