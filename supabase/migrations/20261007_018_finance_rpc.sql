-- VIVA — Migration 018 (Phase 2) : RPC financières serveur + garde clôtures
-- Prérequiss : 001 (helpers), 002 (has_permission), 004 (tables), 005 (policies de base).
-- Principe : l'acteur = auth.uid() exclusivement ; les visas/noms ne viennent
-- jamais du navigateur. SECURITY DEFINER + search_path verrouillé dans chaque
-- fonction. Aucune donnée modifiée, aucune table supprimée.

-- Séquence de références. Les valeurs sont SEQENTIELLES (lpad(nextval)) : la
-- mention « anti-énumération » du commentaire d'origine etait fausse, une
-- reference Viva est numerotee et previsible, comme une piece comptable reelle.
create sequence if not exists public.viva_ref_seq;

-- Génération serveur de référence : <PREFIX>-YYYY-NNNNNN
create or replace function public.reference_mint(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_seq bigint; v_ref text;
begin
  if auth.uid() is null then
    raise exception 'authentification requise.';
  end if;
  if p_prefix !~ '^[A-Z-]{3,20}$' then
    raise exception 'préfixe invalide.';
  end if;
  if not (public.has_permission('erp.create') or public.has_permission('quotes.create')) then
    raise exception 'permission refusée.';
  end if;
  v_seq := nextval('public.viva_ref_seq');
  v_ref := p_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 6, '0');
  return v_ref;
end;
$$;

-- Visa manager : en_attente_manager -> en_attente_otp_daf (approbateur != initiateur).
create or replace function public.erp_approve_manager(p_piece text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid; v_tx public.erp_transactions%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentification requise.'; end if;
  if not public.has_permission('erp.update') then
    raise exception 'permission refusée (erp.update requis).';
  end if;
  select * into v_tx from public.erp_transactions where piece_reference = p_piece;
  if not found then raise exception 'transaction introuvable ou non autorisée.'; end if;
  if v_tx.validation_status <> 'en_attente_manager' then
    -- Message neutre : echoes the real status would turn this RPC into an oracle
    -- revealing the workflow state of a piece the caller cannot SELECT.
    raise exception 'état incompatible pour cette pièce.';
  end if;
  if v_tx.performed_by = v_uid then
    raise exception 'séparation des fonctions : l’initiateur ne peut pas viser.';
  end if;
  update public.erp_transactions
    set manager_approved_by = v_uid
    where piece_reference = p_piece;
  -- Transition via UPDATE direct interdit aux rôles (pas de policy) : la fonction
  -- contourne RLS en SECURITY DEFINER, mais le trigger d'immutabilité s'applique.
  update public.erp_transactions
    set validation_status = 'en_attente_otp_daf'
    where piece_reference = p_piece;
  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_TRANSACTION_MANAGER_APPROVED', 'erp_transactions', p_piece, 'success',
      jsonb_build_object('manager', v_uid));
end;
$$;

-- Validation DAF : en_attente_otp_daf -> valide (validateur distinct des deux autres).
-- NOTE : pas de canal OTP connecté (constat L-2) : la validation est une
-- attestation nominative vérifiée serveur, pas un code SMS.
create or replace function public.erp_validate_daf(p_piece text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid; v_tx public.erp_transactions%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentification requise.'; end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  select * into v_tx from public.erp_transactions where piece_reference = p_piece;
  if not found then raise exception 'transaction introuvable ou non autorisée.'; end if;
  if v_tx.validation_status <> 'en_attente_otp_daf' then
    raise exception 'état incompatible : % (attendu en_attente_otp_daf).', v_tx.validation_status;
  end if;
  if v_tx.performed_by = v_uid then
    raise exception 'séparation des fonctions : l’initiateur ne peut pas valider.';
  end if;
  if v_tx.manager_approved_by = v_uid then
    raise exception 'séparation des fonctions : le manager viseur ne peut pas valider.';
  end if;
  update public.erp_transactions
    set validation_status = 'valide', daf_validated_by = v_uid, daf_validated_at = now()
    where piece_reference = p_piece;
  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_TRANSACTION_DOUBLE_SIGNATURE_COMPLETE', 'erp_transactions', p_piece, 'success',
      jsonb_build_object('daf', v_uid));
end;
$$;

-- Contrepassation : crée l'écriture inverse liée, jamais de modification.
-- La colonne liée reversed_by est declaree dans 004 : elle etait referencee par
-- cette fonction sans jamais avoir ete creee par aucune migration (le corps plpgsql
-- n'est parse qu'a l'appel, d'ou un 42703 au premier clic et non a l'application).
create or replace function public.erp_reverse_tx(p_piece text, p_reason text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid; v_tx public.erp_transactions%rowtype; v_new_ref text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentification requise.'; end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 8 then
    raise exception 'motif de contrepassation requis (min 8 caractères).';
  end if;
  select * into v_tx from public.erp_transactions where piece_reference = p_piece;
  if not found then raise exception 'transaction introuvable ou non autorisée.'; end if;
  if v_tx.validation_status <> 'valide' then
    raise exception 'seule une transaction validée peut être contrepassée.';
  end if;
  v_new_ref := 'CONTRE-' || v_tx.piece_reference;
  insert into public.erp_transactions (
    piece_reference, direction, category, account_code, description,
    amount_usd, amount_cdf, payment_account, counterparty, performed_by,
    requires_double_signature, validation_status, reversed_by
  ) values (
    v_new_ref,
    case when v_tx.direction = 'recette' then 'depense' else 'recette' end,
    v_tx.category, v_tx.account_code,
    'CONTREPASSATION D’ANNULATION : ' || v_tx.piece_reference || ' — Motif : ' || trim(p_reason),
    v_tx.amount_usd, v_tx.amount_cdf, v_tx.payment_account,
    'Régularisation ' || v_tx.counterparty,
    v_uid, false, 'valide', v_tx.id
  );
  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_TRANSACTION_REVERSED_COUNTERPASS', 'erp_transactions', v_new_ref, 'success',
      jsonb_build_object('original', p_piece, 'reason', trim(p_reason)));
  return v_new_ref;
end;
$$;

-- Clôtures : colonnes de validation + immutabilité + resserrement RLS.
alter table public.cash_closures
  add column if not exists validated_by uuid references public.profiles (id) on delete set null;
alter table public.cash_closures
  add column if not exists validated_at timestamptz;

create or replace function public.closure_validate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid; v_cl public.cash_closures%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'authentification requise.'; end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  select * into v_cl from public.cash_closures where id = p_id;
  if not found then raise exception 'clôture introuvable ou non autorisée.'; end if;
  if v_cl.validated_by is not null then
    raise exception 'clôture déjà validée (immuable).';
  end if;
  update public.cash_closures
    set validated_by = v_uid, validated_at = now(), status = 'conforme'
    where id = p_id;
  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_CASH_CLOSURE_VALIDATED', 'cash_closures', p_id::text, 'success',
      jsonb_build_object('pv', v_cl.pv_reference));
end;
$$;

create or replace function public.prevent_closure_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Suppression de clôture interdite (traçabilité).';
  end if;
  if tg_op = 'UPDATE' and old.validated_by is not null then
    raise exception 'Clôture validée immuable.';
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_closure_immutable on public.cash_closures;
create trigger trg_closure_immutable before update or delete on public.cash_closures
  for each row execute function public.prevent_closure_mutation();

-- Resserrement : update/delete des clôtures exigent erp.validate (plus erp.view seul).
drop policy if exists closures_staff on public.cash_closures;
-- Drops manquants : ces trois creations sans « drop ... if exists » rendaient 018
-- non rejouable (policy already exists au premier retry, alors que 017 peut
-- echouer et faire rejouer la chaine).
drop policy if exists closures_staff_read on public.cash_closures;
drop policy if exists closures_staff_write on public.cash_closures;
drop policy if exists closures_staff_update on public.cash_closures;
create policy closures_staff_read on public.cash_closures for select
  to authenticated using (public.has_permission('erp.view'));
create policy closures_staff_write on public.cash_closures for insert
  to authenticated with check (public.has_permission('erp.validate'));
create policy closures_staff_update on public.cash_closures for update
  to authenticated
  using (public.has_permission('erp.validate'))
  with check (public.has_permission('erp.validate'));

-- EXECUTE : révoqué au public, accordé aux authentifiés (RLS/RPC vérifient ensuite).
revoke all on function public.reference_mint(text) from public;
revoke all on function public.erp_approve_manager(text) from public;
revoke all on function public.erp_validate_daf(text) from public;
revoke all on function public.erp_reverse_tx(text, text) from public;
revoke all on function public.closure_validate(uuid) from public;
grant execute on function public.reference_mint(text) to authenticated, service_role;
grant execute on function public.erp_approve_manager(text) to authenticated, service_role;
grant execute on function public.erp_validate_daf(text) to authenticated, service_role;
grant execute on function public.erp_reverse_tx(text, text) to authenticated, service_role;
grant execute on function public.closure_validate(uuid) to authenticated, service_role;

-- Vérification post-migration (lecture seule) :
--   select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and proname in ('reference_mint','erp_approve_manager','erp_validate_daf','erp_reverse_tx','closure_validate','prevent_closure_mutation');
--   (attendu : 6 lignes)
--   select column_name from information_schema.columns where table_schema='public' and table_name='cash_closures' and column_name in ('validated_by','validated_at');
-- Retour arrière : drop function ... (5 RPC + trigger + 2 colonnes, jamais de données).
