-- VIVA — Migration 028 : verrouillage des privileges herites de l'initialisation Supabase
--
-- Constat mesure (2026-10-24, apres 001->027 sur gvxwrhzcgwfswqcnqfbi) :
--   pg_default_acl contient, pour le role postgres, une entree qui accorde
--   « anon=arwdDxtm » sur TOUTE table future de public et « anon=X » sur toute
--   fonction future. C'est le reglage par defaut de Supabase, pas un choix VIVA.
--   consequence : les « revoke ... from public » de 002, 018, 023, 026 et 027
--   sont neutralises, car ils ne visent que le pseudo-role PUBLIC et jamais la
--   grille explicite « anon ». Mesure reelle apres 027 : anon disposait de
--   SELECT sur les 68 tables et de EXECUTE sur 22 fonctions, dont closure_create,
--   closure_validate, opening_balance_set, erp_validate_daf, erp_approve_manager,
--   erp_reverse_tx et reference_mint.
--   Ce qui protegeait les donnees : la seule RLS (anon ne lisait des lignes que
--   dans 11 tables). Un oubli de politique sur une table future = exposure
--   immediate, sans erreur ni signal.
--
-- Cette migration ne modifie AUCUNE donnee, AUCUNE politique RLS, AUCUNE table.
-- Elle aligne les privileges de table sur la frontiere deja declaree par les
-- policies, et retire le ticket automatique pour les objets futurs.
-- Idempotente (revoke = no-op si deja revoke). Rejouable.
--
-- Surface publique figee dans ce fichier, identique aux 13 policies anon de 005,
-- 008, 009, 013 et 014 :
--   SELECT  : cms_sections, feature_flags, form_fields, forms, media_items,
--             menus, modules, pages, seo_meta, youtube_config, youtube_videos
--             + la vue v_org_units_public (008)
--   INSERT  : quotes, form_submissions (formulaire public et demande de devis)
--   EXECUTE : has_permission(text) uniquement — seule fonction appelee par une
--             politique anon (form_fields_read).

-- ============================================================
-- 1. Objets FUTURS : anon ne recoit plus rien a la creation
-- ============================================================
-- Perimetre volontaire : « for role postgres », c'est-a-dire les migrations VIVA.
-- Les entrees supabase_admin (schemas auth/storage/realtime geres par la
-- plateforme) sont laissees intactes : y toucher casserait l'outillage Supabase.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

-- ============================================================
-- 2. Objets EXISTANTS : tables hors surface publique
-- ============================================================
-- « revoke all » retire aussi les droits de la liste publique : la clause
-- « not in (...) » protege donc explicitement les 11 tables de lecture et les
-- 2 tables d'alimentation, qui sont traitees a part juste en dessous.
do $$
declare
  r record;
begin
  for r in
    select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not in (
        'cms_sections','feature_flags','form_fields','forms','media_items',
        'menus','modules','pages','seo_meta','youtube_config','youtube_videos',
        'quotes','form_submissions'
      )
  loop
    execute format('revoke all on table %s from anon', r.oid::regclass);
  end loop;
end;
$$;

-- Tables de lecture publique : SELECT seul. Ni ecriture, ni reference, ni truncate.
do $$
declare
  r record;
begin
  for r in
    select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'cms_sections','feature_flags','form_fields','forms','media_items',
        'menus','modules','pages','seo_meta','youtube_config','youtube_videos'
      )
  loop
    execute format('revoke insert, update, delete, truncate, references on table %s from anon', r.oid::regclass);
  end loop;
end;
$$;

-- Tables alimentees par les visiteurs : INSERT seul. Sans SELECT, les policies
-- « to anon » de 005 seraient du code mort ; avec SELECT, un visiteur pourrait
-- relire les demandes des autres. L'insertion seule est la bonne frontiere.
do $$
declare
  r record;
begin
  for r in
    select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in ('quotes','form_submissions')
  loop
    execute format('revoke select, update, delete, truncate, references on table %s from anon', r.oid::regclass);
    execute format('grant insert on table %s to anon', r.oid::regclass);
  end loop;
end;
$$;

-- ============================================================
-- 3. Fonctions : anon ne peut plus appeler la logique metier
-- ============================================================
-- has_permission reste executable : les expressions de politique RLS sont
-- evaluees avec le role courant, donc anon doit pouvoir l'appeler pour que
-- form_fields_read fonctionne. Les autres helpers de session (current_role_id,
-- current_role_code, is_super_admin) sont revoques : pour anon ils ne renvoyaient
-- que NULL, ils n'ont aucun appelant legitime cote public.
do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname <> 'has_permission'
  loop
    execute format('revoke all on function %s from anon', r.oid::regprocedure);
    n := n + 1;
  end loop;
  raise notice 'VIVA 028 : % fonctions revoquees a anon (hors has_permission)', n;
end;
$$;

-- ============================================================
-- Controles apres application (lecture seule)
-- ============================================================
--  select string_agg(relname, ', ' order by relname)
--  from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname='public' and c.relkind in ('r','v')
--    and has_table_privilege('anon', c.oid, 'SELECT');
--    attendu : les 11 tables publiques + v_org_units_public exactement
--
--  select string_agg(relname, ', ' order by relname)
--  from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname='public' and c.relkind='r'
--    and has_table_privilege('anon', c.oid, 'INSERT');
--    attendu : form_submissions, quotes
--
--  select string_agg(p.proname, ', ' order by p.proname)
--  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
--    attendu : has_permission
--
--  select defaclacl::text from pg_default_acl d
--  join pg_namespace n on n.oid = d.defaclnamespace
--  where n.nspname='public' and d.defaclrole = 'postgres'::regrole;
--    attendu : aucune occurrence de « anon= »
--
--  select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;
--    attendu : 0 (inchange)
--
--  select count(*) from pg_policies where schemaname='public';
--    attendu : 170 (inchange — aucune politique touchee ici)
--
-- Test fonctionnel sans ecriture permanente :
--  begin; set role anon;
--  insert into public.quotes (client_name, client_email, event_name)
--    values ('T', 't@t.cd', 'T');                      -- doit reussir
--  select count(*) from public.quotes;                  -- doit lever 42501
--  select count(*) from public.audit_logs;              -- doit lever 42501
--  rollback;
--
-- Retour arriere complet : re-executer les privileges par defaut supprimes puis
--   grant select on <11 tables> to anon;  (etat 027 = anon select+execute partout,
--   ce que cette migration vient corriger ; le retour arriere n'est donc voulu
--   que pour un diagnostic ponctuel).
