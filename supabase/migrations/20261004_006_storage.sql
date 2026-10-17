-- CHANTIER 2 — 006 : Storage (buckets + policies, respect RBAC, jamais allow-all-upload)
-- Buckets : media, cms, quotes, erp, signatures. Tous privés sauf lecture publique
-- ciblée via policies SELECT sur storage.objects (media/cms publics publiés).
-- Nécessite l'extension storage (présente sur Supabase). Idempotent.

insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('cms', 'cms', true),
  ('quotes', 'quotes', false),
  ('erp', 'erp', false),
  ('signatures', 'signatures', false)
on conflict (id) do update set public = excluded.public;

-- Lecture publique : media/cms uniquement (les objets privés restent protégés
-- par le chemin ; la sélection fine public/published est faite côté tables).
drop policy if exists storage_media_public_read on storage.objects;
create policy storage_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id in ('media','cms'));
-- Lecture privée : quotes/erp/signatures au staff habilité (via has_permission)
drop policy if exists storage_private_staff_read on storage.objects;
create policy storage_private_staff_read on storage.objects for select to authenticated
  using (bucket_id in ('quotes','erp','signatures')
    and (public.has_permission('erp.view') or public.has_permission('quotes.view')
      or public.has_permission('media.view')));
-- Écriture : jamais open. media/cms via media.upload, quotes via quotes.create,
-- erp/signatures via erp.create/validate.
drop policy if exists storage_media_upload on storage.objects;
create policy storage_media_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('media','cms') and public.has_permission('media.upload'));
drop policy if exists storage_quotes_upload on storage.objects;
create policy storage_quotes_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'quotes'
    and (public.has_permission('quotes.create') or public.has_permission('quotes.view')));
drop policy if exists storage_erp_upload on storage.objects;
create policy storage_erp_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('erp','signatures') and public.has_permission('erp.create'));
-- Mise à jour / suppression : staff restreint, jamais anon.
drop policy if exists storage_staff_update on storage.objects;
create policy storage_staff_update on storage.objects for update to authenticated
  using (public.has_permission('media.upload') or public.has_permission('erp.create'))
  with check (public.has_permission('media.upload') or public.has_permission('erp.create'));
drop policy if exists storage_staff_delete on storage.objects;
create policy storage_staff_delete on storage.objects for delete to authenticated
  using (public.has_permission('media.upload') or public.has_permission('erp.create'));
