-- VIVA — Migration 030 : verrouillage des SEQUENCES pour anon
--
-- Solde de la migration 028. 028 neutralise les privileges par defaut pour les
-- sequences FUTURES et boucle sur les tables et les fonctions existantes. Elle
-- ne bouclait pas sur relkind = 'S', donc la seule sequence du schema public a
-- garde l'octroi herite de l'initialisation Supabase :
--   viva_ref_seq : anon USAGE=true, SELECT=true, UPDATE=true
--
-- Impact mesure : un visiteur sans jeton peut avancer le compteur de references
-- (nextval), donc consummer des numeros DEV-VES-XXXX sans jamais ecrire de
-- ligne. Pas d'acces aux donnees, mais un privilege inutile et une usure
-- possible du compteur.
--
-- Verification prealable du non-basculement :
--   - aucun default de colonne du schema public n'utilise nextval
--     (select ... pg_get_expr(adbin, adrelid) like '%nextval%' => 0 ligne)
--   - la sequence n'est appelee que depuis reference_mint(), dont
--     anon_exec=false depuis 028 et auth_exec=true
--   - quotes.reference_number n'a AUCUN default : le formulaire public fournit
--     la reference cote client (src/context/ProjectDataContext.tsx:1373)
--   - insertion visiteur testee apres 029 : acceptee sans la sequence
-- Donc retirer ces droits ne casse aucun parcours public.
--
-- Idempotente, rejouable. Aucune donnee, aucune politique RLS, aucune table
-- touchee.

do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
  loop
    execute format('revoke all on sequence %s from anon', r.oid::regclass);
    n := n + 1;
  end loop;
  raise notice 'VIVA 030 : % sequence(s) retiree(s) a anon', n;
end;
$$;

-- ============================================================
-- Controles apres application (lecture seule)
-- ============================================================
--  select s.relname,
--         has_sequence_privilege('anon', s.oid, 'USAGE')          as anon_usage,
--         has_sequence_privilege('authenticated', s.oid, 'USAGE') as auth_usage
--  from pg_class s join pg_namespace n on n.oid = s.relnamespace
--  where n.nspname = 'public' and s.relkind = 'S';
--    attendu : anon_usage = false, auth_usage = true
--
--  begin; set role anon;
--  insert into public.quotes (reference_number, client_name, client_email, event_name)
--    values ('DEV-VES-2026-991', 'T', 't@t.cd', 'T');        -- doit reussir
--  rollback;
--
--  begin; set role authenticated;
--  select last_value from public.viva_ref_seq; reset role; rollback; -- droit conserve
--
-- Retour arriere : grant all on public.viva_ref_seq to anon;
