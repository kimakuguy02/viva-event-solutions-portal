-- CHANTIER 2 — 006 : Storage (buckets + policies, respect RBAC, jamais allow-all-upload)
-- Buckets : media, cms, quotes, erp, signatures.
--
-- Decision prise ici : seul « media » reste public, parce que c'est le bucket de la
-- galerie de la vitrine (les visuels publies sont destinables au monde entier).
-- « cms » devient prive : il contient des brouillons de pages, et un bucket public
-- rend chaque objet lisible par URL independamment de toute policy. Les brouillons
-- de media ne doivent etre deposes ici qu'au moment de la publication ; tout autre
-- contenu sensible passe par quotes/erp/signatures/client_docs.
--
-- Convention de chemin imposee par les policies : tout objet lie a un compte est
-- range sous <uid>/ racine. Sans ce predicat, n'importe quel upload autorise
-- pouvait ecrire dans le dossier d'un autre client.
--
-- Le client n'appelle pas encore storage (upload reste cote Firebase) : ces
-- policies sont ecrites avant le cablage, pas apres.

insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('cms', 'cms', false),
  ('quotes', 'quotes', false),
  ('erp', 'erp', false),
  ('signatures', 'signatures', false)
on conflict (id) do update set public = excluded.public;

-- ---------- Lecture ----------
-- media : galerie publique. cms : staff habile uniquement.
drop policy if exists storage_media_public_read on storage.objects;
create policy storage_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
drop policy if exists storage_cms_staff_read on storage.objects;
create policy storage_cms_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'cms' and public.has_permission('cms.view'));

-- quotes/erp/signatures/documents : soit le proprietaire (1er segment = uid),
-- soit le staff. media.view et quotes.view sont volontairement EXCLUS : le role
-- CLIENT possede quotes.view et VISITOR possede media.view (003:194, 03:201), donc
-- l'ancienne formulation laissait n'importe quel compte connecte lire les pieces
-- d'identite, contrats et justifications de caisse de tout le monde.
drop policy if exists storage_private_staff_read on storage.objects;
create policy storage_private_staff_read on storage.objects for select to authenticated
  using (
    bucket_id in ('quotes','erp','signatures')
    and (
      (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      or public.has_permission('quotes.manage')
      or public.has_permission('erp.view')
    )
  );

-- ---------- Ecriture ----------
-- media/cms : upload reserve au droit media.upload, chemin non lie a un compte.
drop policy if exists storage_media_upload on storage.objects;
create policy storage_media_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('media','cms') and public.has_permission('media.upload'));
-- quotes/signatures : le deposant n'ecrit que dans son propre dossier.
drop policy if exists storage_quotes_upload on storage.objects;
create policy storage_quotes_upload on storage.objects for insert to authenticated
  with check (
    bucket_id in ('quotes','signatures')
    and (storage.foldername(name))[1] = auth.uid()::text
    and (public.has_permission('quotes.create')
      or public.has_permission('quotes.update')
      or public.has_permission('erp.create'))
  );
-- erp : pieces comptables deposes par le staff habile.
drop policy if exists storage_erp_upload on storage.objects;
create policy storage_erp_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'erp' and public.has_permission('erp.create'));

-- ---------- Modification / suppression ----------
-- Remplacement d'objet : meme droit que l'upload du bucket considere.
drop policy if exists storage_staff_update on storage.objects;
drop policy if exists storage_media_update on storage.objects;
create policy storage_media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_permission('media.upload'))
  with check (bucket_id = 'media' and public.has_permission('media.upload'));
drop policy if exists storage_cms_update on storage.objects;
create policy storage_cms_update on storage.objects for update to authenticated
  using (bucket_id = 'cms' and public.has_permission('cms.update'))
  with check (bucket_id = 'cms' and public.has_permission('cms.update'));
drop policy if exists storage_erp_update on storage.objects;
create policy storage_erp_update on storage.objects for update to authenticated
  using (bucket_id in ('erp','quotes','signatures') and public.has_permission('erp.update'))
  with check (bucket_id in ('erp','quotes','signatures') and public.has_permission('erp.update'));

-- Drop : uniquement un droit de gestion, jamais un droit de depot.
-- « has_permission('media.upload') » autorisait l'effacement de tous les fichiers.
drop policy if exists storage_staff_delete on storage.objects;
drop policy if exists storage_media_delete on storage.objects;
create policy storage_media_delete on storage.objects for delete to authenticated
  using (bucket_id in ('media','cms') and public.has_permission('media.delete'));
drop policy if exists storage_private_delete on storage.objects;
create policy storage_private_delete on storage.objects for delete to authenticated
  using (
    bucket_id in ('quotes','erp','signatures')
    and (
      (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      or public.has_permission('erp.validate')
    )
  );
