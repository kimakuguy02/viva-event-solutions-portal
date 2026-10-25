-- VIVA — Migration 029 : verrouillage des privileges sur les VUES
--
-- Decouvert en controlant le resultat de 028, et 028 ne pouvait pas le voir :
-- ses boucles filtrent « relkind = 'r' » (tables), alors que les privileges
-- herites de l'initialisation Supabase portent aussi sur les relations de type
-- vue. Etat mesure apres 028 sur gvxwrhzcgwfswqcnqfbi :
--   v_client_timeline   anon = INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,
--                       TRIGGER,MAINTAIN
--   v_org_units_public  anon = idem
--   (reloptions des deux : only v_client_timeline porte security_invoker=true)
--
-- v_org_units_public est une vue SECURITY DEFINER (reloptions NULL) : elle est
-- lue avec les droits de son proprietaire, donc la RLS de org_units ne filtre
-- PAS ses lectures. C'est voulu pour l'organigramme public. Mais une vue simple
-- est aussi modifiable, et la clause WITH CHECK de la RLS n'est pas appliquee
-- aux ecritures qui passent par le proprietaire.
--
-- PREUVE EXPLOIT (executee dans une transaction puis rollback, 0 ligne
-- permanente) :
--   begin; set role anon;
--   with u as (update public.v_org_units_public set description = description
--              returning id) select count(*) from u;
--   => updated_rows = 9   (un visiteur sans jeton modifiait les 9 unites)
--   rollback;
-- DELETE etait accorde de la meme facon : un visiteur pouvait vider
-- l'organigramme (noms, postes, sites des responsables).
--
-- Cette migration ne touche AUCUNE donnee, AUCUNE politique RLS, AUCUNE
-- definition de vue. Elle aligne les privileges des vues sur l'usage reel du
-- code. Idempotente, rejouable.
--
-- Usage verifie dans le frontend (src/services/supabase/formOrgService.ts) :
--   - lecture : orgReadSource() renvoie 'v_org_units_public' et ne fait que
--     du select (pages publiques + CLIENT + chef d'equipe sans organization.manage)
--   - ecriture : saveOrgUnits() passe par la table de base org_units
--     (update/insert/delete), jamais par la vue.
-- Donc supprimer le DML sur les vues ne casse aucun parcours.
--
-- v_client_timeline : 017 line 236 declare l'intention « anon : rien », la vue
-- est security_invoker (la RLS des tables filtrent deja les lignes), et aucun
-- code du depot ne la reference. On retire SELECT a anon et on laisse a
-- authenticated le select que 017 lui accordait.

-- ============================================================
-- 1. v_org_units_public : lecture publique uniquement
-- ============================================================
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.v_org_units_public from anon;
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.v_org_units_public from authenticated;
grant select on public.v_org_units_public to anon;
grant select on public.v_org_units_public to authenticated;

-- ============================================================
-- 2. v_client_timeline : aucune lecture visiteur
-- ============================================================
revoke all on public.v_client_timeline from anon;
grant select on public.v_client_timeline to authenticated;

-- ============================================================
-- 3. Vues FUTURES : rien pour anon a la creation
-- ============================================================
-- 028 a deja pose « alter default privileges for role postgres in schema public
-- revoke all on tables from anon ». La mesure de 029 le confirme : les vues
-- heritaient de ces memes privileges par defaut, donc ils les couvrent a la
-- creation. Rien a ajouter ici ; le controle ci-dessous le verifiera.

-- ============================================================
-- Controles apres application (lecture seule)
-- ============================================================
--  select c.relname,
--         (select string_agg(a.privilege_type, ',' order by a.privilege_type)
--            from aclexplode(c.relacl) a where a.grantee = 'anon'::regrole) as anon_priv
--  from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname = 'public' and c.relkind = 'v';
--    attendu : v_client_timeline = NULL (plus aucune occurrence)
--              v_org_units_public  = SELECT
--
--  select string_agg(relname, ', ' order by relname)
--  from pg_class c join pg_namespace n on n.oid = c.relnamespace
--  where n.nspname='public' and c.relkind in ('r','v')
--    and has_table_privilege('anon', c.oid, 'SELECT');
--    attendu : les 11 tables publiques + v_org_units_public exactement (12),
--              sans v_client_timeline
--
-- Test fonctionnel sans ecriture permanente :
--  begin; set role anon;
--  with u as (update public.v_org_units_public set description = description
--             returning id) select count(*) from u;   -- doit lever 42501
--  rollback;
--  begin; set role anon;
--  select count(*) from public.org_units;             -- doit lever 42501
--  rollback;
--  begin; set role anon;
--  select count(*) from public.v_org_units_public;    -- doit reussir (> 0)
--  rollback;
--
-- Retour arriere : les privileges retires etaient accidentels (herites du
-- reglage initial de la plateforme, non un choix VIVA). Pour un diagnostic
-- ponctuel : grant all on public.v_org_units_public to anon;
--             grant all on public.v_client_timeline to anon;
