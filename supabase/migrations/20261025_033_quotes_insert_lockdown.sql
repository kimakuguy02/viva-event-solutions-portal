-- VIVA — Migration 033 : la RPC submit_quote est la seule voie d'insertion devis
--
-- Constat mesuré après 031/032 :
--   has_table_privilege('anon','public.quotes','INSERT') = true
--   policy quotes_public_insert (anon + authenticated) accepte tout insert
--   dont status='submitted'.
-- Un visiteur pouvait donc appeler POST /rest/v1/quotes directement avec une
-- référence, un total et une date arbitraires, sans passer par submit_quote :
-- le mint serveur de la référence (031) était contournable.
--
-- Correctif : révocation du DML direct sur quotes. La RPC SECURITY DEFINER
-- submit_quote reste exécutable par anon/authenticated et écrit en tant que
-- propriétaire ; elle n'a besoin d'aucun privilège de table pour l'appelant.
-- La politique quotes_public_insert est supprimée (elle n'avait plus d'objet).
--
-- v_client_timeline : 029 avait révoqué anon mais laissé à authenticated le DML
-- hérité (INSERT/UPDATE/DELETE/TRUNCATE) sur une vue UNION non modifiable et
-- inutilisée par le code. On ne garde que SELECT.
--
-- Aucune donnée modifiée. Idempotent, rejouable.
--
-- Retour arrière :
--   grant insert on public.quotes to anon, authenticated;
--   create policy quotes_public_insert on public.quotes for insert to anon, authenticated
--     with check (status = 'submitted' and (auth.uid() is null or submitted_by = auth.uid()));

begin;

revoke insert, update, delete, truncate, references, trigger, maintain
  on public.quotes from anon;
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.quotes from authenticated;
revoke insert, update, delete, truncate, references, trigger, maintain
  on public.quotes from public;

drop policy if exists quotes_public_insert on public.quotes;

revoke all on public.v_client_timeline from authenticated;
grant select on public.v_client_timeline to authenticated;

commit;

-- ============================================================
-- Contrôles après application (lecture seule)
-- ============================================================
--  select has_table_privilege('anon','public.quotes','INSERT') as anon_insert,
--         has_table_privilege('authenticated','public.quotes','INSERT') as auth_insert,
--         has_table_privilege('authenticated','public.quotes','SELECT') as auth_select;
--    attendu : false, false, true
--
--  begin; set role anon;
--  insert into public.quotes (reference_number, client_name, client_email, event_name)
--    values ('DEV-VES-2026-999999','Test','test@example.cd','Test');
--    attendu : ERROR 42501 permission denied for table quotes
--  rollback;
