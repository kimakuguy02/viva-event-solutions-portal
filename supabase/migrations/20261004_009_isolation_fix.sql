-- VIVA — Migration 009 : isolation cross-client (corrige 003 + 005)
-- Constat TEST 2 : CLIENT possède quotes.view/projects.view/forms.view/media.view,
-- et les policies owner utilisaient ces mêmes permissions pour l'accès croisé
-- => tout CLIENT lisait TOUS les devis/projets/soumissions. FAILLE RÉELLE.
-- Correctif : permissions *.manage réservées staff pour l'accès croisé ;
-- les permissions *.view gardent leur rôle UX (menus/fonctionnalités).
-- Idempotent. Ne modifie pas 001→008.

-- 1. Nouvelles permissions staff
insert into public.permissions (code, name, description, module) values
  ('projects.manage', 'Gérer les projets (accès croisé)', 'Lecture/écriture tous projets.', 'projects'),
  ('forms.manage', 'Gérer les formulaires et soumissions', 'Lecture toutes soumissions.', 'forms'),
  ('media.manage', 'Gérer les médias', 'Lecture/écriture tous médias.', 'media')
on conflict (code) do nothing;

-- 2. Attribution staff (SUPER_ADMIN reçoit tout via 003-cross, compléter ici)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.code in ('projects.manage','forms.manage','media.manage') and r.code = 'SUPER_ADMIN'
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'ADMIN_GENERAL' and p.code in ('projects.manage','forms.manage','media.manage')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'DG_GERANT' and p.code in ('projects.manage','forms.manage','media.manage')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'ADMIN_RH' and p.code in ('projects.manage','forms.manage')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'DAF_COMPTABLE' and p.code = 'projects.manage'
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'CHEF_EQUIPE' and p.code = 'projects.manage'
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'COMMERCIAL_SECRETAIRE' and p.code in ('projects.manage','forms.manage','media.manage')
on conflict do nothing;
-- CLIENT / VISITOR : volontairement exclus (leurs *.view restent UX uniquement)

-- 3. Policies corrigées : accès croisé = *.manage (staff), jamais *.view
drop policy if exists quotes_owner_read on public.quotes;
create policy quotes_owner_read on public.quotes for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('quotes.manage'));

drop policy if exists quote_items_read on public.quote_items;
create policy quote_items_read on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and (q.submitted_by = auth.uid() or public.has_permission('quotes.manage'))));

drop policy if exists projects_staff_read on public.projects;
create policy projects_staff_read on public.projects for select to authenticated
  using (lead_profile_id = auth.uid() or public.has_permission('projects.manage'));

drop policy if exists submissions_staff_read on public.form_submissions;
create policy submissions_staff_read on public.form_submissions for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('forms.manage'));

drop policy if exists media_staff_read on public.media_items;
create policy media_staff_read on public.media_items for select to authenticated
  using (public.has_permission('media.manage'));

drop policy if exists youtube_staff_write on public.youtube_videos;
create policy youtube_staff_write on public.youtube_videos for all to authenticated
  using (public.has_permission('media.manage'))
  with check (public.has_permission('media.upload'));
