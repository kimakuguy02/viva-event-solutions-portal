-- VIVA — Migration 008 : privilèges TABLE-level (complément 001→007)
-- Constat TEST 2 : sans GRANT, PostgREST retourne 42501 AVANT même d'évaluer
-- RLS. Les GRANT sont nécessaires mais non suffisants : RLS reste la frontière.
-- Idempotent. À exécuter après 001→007.

-- Schéma
grant usage on schema public to anon, authenticated;

-- Authenticated : droits nécessaires aux policies (RLS filtre ensuite).
-- L'alter default privileges est volontaire : les tables créees par 013→021
-- n'ont pas de GRANT explicite et seraient sinon en 42501 permanent.
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- Anon : lecture seule strictement sur les tables à visibilité publique
-- (les policies *_public_read filtrent ensuite : published/actifs uniquement).
--
-- Les deux « alter default privileges ... to anon » precedents etaient supprimes :
-- ils rendaient chaque table creee apres 008 selectabale par anon (feature_flags,
-- pages, seo_meta, contacts, tickets, journaux OHADA, workflows...). La liste est
-- desormais explicite : une table publique est une decision, pas un accident.
grant select on public.cms_sections to anon;
grant select on public.menus to anon;
grant select on public.modules to anon;
grant select on public.forms to anon;
grant select on public.form_fields to anon;
grant select on public.media_items to anon;
grant select on public.youtube_config to anon;
grant select on public.youtube_videos to anon;
-- feature_flags (013:40) et pages/seo_meta (014:75) sont accordes a anon par leur
-- propre fichier : les repeter ici echouerait, ces tables n'existent pas a 008.

-- Depot public : le formulaire en ligne et la demande de devis sont alimentes par
-- des visiteurs anonymes. Sans INSERT, les policies « to anon » de 005 etaient du
-- code mort et les deux ecrans publics echouaient en 42501.
grant insert on public.quotes to anon;
grant insert on public.form_submissions to anon;

-- ---------- Organigramme : fin de l'exposition des coordonnees du personnel ----------
-- grant select on org_units + policy « using (is_active) » = l'anonyme lisait
-- manager_name, manager_email, manager_phone, photo_url et location de chaque
-- direction. Les seeds 007 laissent ces colonnes NULL, donc le trou etait latent :
-- la premiere fiche saisie dans « Organisation » la publiait sur Internet.
-- anon ne lit plus la table, seulement la vue sans coordonnees.
create or replace view public.v_org_units_public
as
  select id, parent_id, code, name, description, unit_type, manager_name,
         location, position, is_active, created_at, updated_at
  from public.org_units
  where is_active;
-- Le nom du responsable et la localisation restent publics (c'est l'organigramme
-- de la vitrine). Sont exclus : manager_email, manager_phone, photo_url et
-- manager_profile_id — coordonnees personnelles du personnel, destinées au back-
-- office. La vue est creee par le proprietaire et lue par anon : la RLS d'org_units
-- ne s'applique pas ici (pas de security_invoker), donc la liste de colonnes ci-
-- dessus est la seule frontiere — elle est fixee dans le DDL, pas par l'appelant.
grant select on public.v_org_units_public to anon, authenticated;
revoke select on public.org_units from anon;
