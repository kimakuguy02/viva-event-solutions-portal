-- VIVA — Migration 031 : référence devis générée côté serveur
--
-- Constat : le formulaire public fabriquait la référence dans le navigateur
-- (`DEV-VES-2026-` + 3 chiffres aléatoires) avant de l'insérer. Un visiteur
-- pouvait donc choisir un numéro arbitraire, provoquer des collisions et
-- contourner le compteur officiel.
--
-- Correctif : RPC `submit_quote` SECURITY DEFINER, seule voie d'insertion
-- publique. Elle :
--   - ignore toute référence fournie par l'appelant (elle n'en accepte aucune) ;
--   - mint la référence sur public.viva_ref_seq (format DEV-VES-YYYY-NNNNNN) ;
--   - force status='submitted', discount=0, subtotal=total=budget ;
--   - rattache submitted_by = auth.uid() (NULL pour un visiteur anonyme).
-- Aucune donnée existante n'est modifiée. La politique RLS `quotes_public_insert`
-- reste en place comme défense en profondeur.
--
-- Retour arrière : voir le bloc commenté en fin de fichier.

create or replace function public.submit_quote(
  p_client_name text,
  p_client_email text,
  p_event_name text,
  p_event_date date default null,
  p_location text default '',
  p_attendees integer default 0,
  p_budget_usd numeric default 0
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_budget numeric(14,2);
begin
  if coalesce(btrim(p_client_name), '') = '' then
    raise exception 'nom du client requis.';
  end if;
  if coalesce(btrim(p_client_email), '') = '' or position('@' in p_client_email) = 0 then
    raise exception 'email invalide.';
  end if;
  if coalesce(btrim(p_event_name), '') = '' then
    raise exception 'événement requis.';
  end if;
  if p_attendees is not null and p_attendees < 0 then
    raise exception 'participants invalides.';
  end if;
  if p_budget_usd is not null and p_budget_usd < 0 then
    raise exception 'budget invalide.';
  end if;

  v_budget := least(coalesce(p_budget_usd, 0), 999999999999.99);
  v_ref := 'DEV-VES-' || to_char(now(), 'YYYY') || '-'
    || lpad(nextval('public.viva_ref_seq')::text, 6, '0');

  insert into public.quotes (
    reference_number, client_name, client_email, event_name, event_date, location,
    attendees, subtotal_usd, discount_usd, total_usd, status, submitted_by
  ) values (
    v_ref,
    left(btrim(p_client_name), 200),
    left(btrim(p_client_email), 320),
    left(btrim(p_event_name), 200),
    p_event_date,
    left(coalesce(p_location, ''), 200),
    greatest(coalesce(p_attendees, 0), 0),
    v_budget, 0, v_budget, 'submitted', auth.uid()
  );

  return v_ref;
end;
$$;

revoke all on function public.submit_quote(text, text, text, date, text, integer, numeric) from public;
grant execute on function public.submit_quote(text, text, text, date, text, integer, numeric)
  to anon, authenticated;

-- ============================================================
-- Contrôles après application (lecture seule)
-- ============================================================
--  select p.proname, pg_get_userbyid(p.proowner) as owner,
--         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec
--  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'submit_quote';
--    attendu : owner = postgres, anon_exec = true
--
--  begin; set role anon;
--  select public.submit_quote('Test', 'test@example.cd', 'Test RPC');  -- doit retourner DEV-VES-...
--  rollback;
--
-- Retour arrière :
--  drop function if exists public.submit_quote(text, text, text, date, text, integer, numeric);
