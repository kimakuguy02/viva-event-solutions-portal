-- VIVA — Migration 008 : privilèges TABLE-level (complément 001→007)
-- Constat TEST 2 : sans GRANT, PostgREST retourne 42501 AVANT même d'évaluer
-- RLS. Les GRANT sont nécessaires mais non suffisants : RLS reste la frontière.
-- Idempotent. À exécuter après 001→007.

-- Schéma
grant usage on schema public to anon, authenticated;

-- Authenticated : droits nécessaires aux policies (RLS filtre ensuite)
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- Anon : lecture seule strictement sur les tables à visibilité publique
-- (les policies *_public_read filtrent ensuite : published/actifs uniquement)
grant select on public.cms_sections to anon;
grant select on public.menus to anon;
grant select on public.modules to anon;
grant select on public.forms to anon;
grant select on public.form_fields to anon;
grant select on public.media_items to anon;
grant select on public.youtube_config to anon;
grant select on public.youtube_videos to anon;
grant select on public.org_units to anon;
alter default privileges in schema public
  grant select on tables to anon;
