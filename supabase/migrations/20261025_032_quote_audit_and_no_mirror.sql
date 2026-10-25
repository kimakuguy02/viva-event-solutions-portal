-- VIVA — Migration 032 : audit serveur de la soumission devis
--
-- Constat : après la migration 031, le navigateur tentait encore d'écrire
-- `audit_logs` en direct. Un visiteur anonyme recevait un 401 (policy
-- `audit_insert` réservée aux sessions) : la soumission réussissait mais
-- n'était jamais auditée côté serveur.
--
-- Correctif : la RPC `submit_quote` (SECURITY DEFINER) écrit elle-même la
-- ligne d'audit. L'acteur reste NULL pour un visiteur, auth.uid() pour un
-- client connecté. Le trigger `force_audit_actor` conserve ce comportement.
-- Les droits d'exécution sont inchangés.
--
-- Retour arrière : réappliquer 20261025_031_submit_quote_rpc.sql.

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

  insert into public.audit_logs (
    actor_user_id, action, resource, resource_id, result, metadata
  ) values (
    auth.uid(),
    'QUOTE_SUBMITTED',
    'quotes',
    v_ref,
    'success',
    jsonb_build_object(
      'client_name', left(btrim(p_client_name), 200),
      'client_email', left(btrim(p_client_email), 320),
      'event_name', left(btrim(p_event_name), 200),
      'attendees', greatest(coalesce(p_attendees, 0), 0),
      'budget_usd', v_budget,
      'channel', 'public_form'
    )
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
--  begin; set role anon;
--  select public.submit_quote('Test', 'test@example.cd', 'Test audit');
--  select action, resource, resource_id, actor_user_id, metadata
--    from public.audit_logs order by created_at desc limit 1;
--  rollback;   -- aucune ligne devis ni audit ne doit rester
