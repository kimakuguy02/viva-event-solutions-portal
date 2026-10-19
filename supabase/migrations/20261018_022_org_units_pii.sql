-- VIVA — Migration 022 : organigramme — fin de la fuite des coordonnées du personnel
-- Constat post-application (001→021, TEST du 2026-10-18) : 008 a bien créé la vue
-- sans PII et révoqué le select anon sur org_units, mais 005 laissait
-- « org_public_read for select to authenticated using (is_active) ». Un compte
-- CLIENT — ou tout rôle sans organization.manage — lisait donc la table brute et
-- récupérait manager_email, manager_phone, photo_url et manager_profile_id de
-- chaque direction. Le trou était réel : seeds 007 = colonnes NULL, première
-- fiche saisie dans « Organisation » = PII exposée à tout le personnel connecté.
--
-- Frontière désormais : la table brute = les gestionnaires de l'organigramme
-- (organization.manage, qui ont besoin des coordonnées pour les éditer) ;
-- tout le reste passe par v_org_units_public, dont la liste de colonnes est
-- fixée dans le DDL (008) et qui ne peut donc pas faire circuler de PII.
--
-- Idempotent. Aucune donnée modifiée.

drop policy if exists org_public_read on public.org_units;
create policy org_public_read on public.org_units for select
  to authenticated
  using (is_active and public.has_permission('organization.manage'));

-- La vue est déjà accordée à anon + authenticated par 008 : rien de plus à
-- accorder ici. Control : un CLIENT ne doit plus rien lire sur org_units.
