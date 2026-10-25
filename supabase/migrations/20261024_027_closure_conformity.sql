-- VIVA — Migration 027 : clôtures conformes et solde d'ouverture administrable.
-- Constats d'audit R2 (confirmés) :
--  1. 20261020_023 a redéfini closure_validate pour écrire `status = 'anomalie'`
--     alors que 20261007_018 écrivait `status = 'conforme'` : le visa DAF
--     déclasse désormais la clôture qu'il approuve. Aucune clôture ne peut donc
--     finir « conforme », même sans écart.
--  2. closure_create ne sommait que les mouvements du jour (`entry_date =
--     current_date`) et ignorait `public.opening_balances` : la caisse physique
--     d'un jour N ne dépend que des écritures de jour N, ce qui est faux et
--     rend l'écart permanent.
--  3. `rpcValidateClosure` (erpService.ts:125) n'était appelé par aucun écran :
--     le visa DAF n'était jamais enregistré en base.
--
-- ADDITIF : aucune donnée modifiée ni supprimée ; les clôtures déjà enregistrées
-- gardent leur statut (le trigger d'immutabilité 018 le prohibe de toute façon).
-- Rejouable. À appliquer APRÈS 023 dans la chaîne.

-- Solde d'ouverture administrable par le DAF (table créée en 020_c, en lecture
-- seule pour authenticated : l'écriture passe obligatoirement par cette RPC).
create or replace function public.opening_balance_set(
  p_account text,
  p_currency text,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentification requise.';
  end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  if p_account not in ('caisse_usd','caisse_cdf','banque_rawbank_usd',
                       'banque_equity_usd','mpesa_cdf','airtel_money_usd') then
    raise exception 'compte de trésorerie inconnu.';
  end if;
  if p_currency not in ('USD','CDF') then
    raise exception 'devise invalide.';
  end if;
  if p_amount is null
     or p_amount::text in ('NaN','Infinity','-Infinity') then
    raise exception 'montant d''ouverture invalide.';
  end if;

  insert into public.opening_balances (account, currency, amount, set_by, set_at)
    values (p_account, p_currency, round(p_amount, 2), v_uid, now())
  on conflict (account, currency)
    do update set amount = excluded.amount,
                  set_by = excluded.set_by,
                  set_at = excluded.set_at;

  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_OPENING_BALANCE_SET', 'opening_balances',
            p_account || ':' || p_currency, 'success',
            jsonb_build_object('amount', round(p_amount, 2), 'currency', p_currency));
end;
$$;

-- Calcul serveur de la clôture : ouverture + mouvements validés cumulés, puis
-- statut déterminé par l'écart réel et la justification fournie.
create or replace function public.closure_create(
  p_currency text,
  p_counted numeric,
  p_justification text default null
)
returns public.cash_closures
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_payment_account text;
  v_opening numeric(16,2);
  v_moves numeric(16,2);
  v_theoretical numeric(16,2);
  v_counted numeric(16,2);
  v_discrepancy numeric(16,2);
  v_justification text;
  v_status text;
  v_reference text;
  v_closure public.cash_closures%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentification requise.';
  end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  if p_currency is null or p_currency not in ('USD', 'CDF') then
    raise exception 'devise de clôture invalide.';
  end if;
  if p_counted is null
     or p_counted::text in ('NaN', 'Infinity', '-Infinity')
     or p_counted < 0 then
    raise exception 'comptage physique invalide.';
  end if;
  v_counted := round(p_counted, 2);
  if p_justification is not null and char_length(trim(p_justification)) > 2000 then
    raise exception 'justification trop longue.';
  end if;

  v_payment_account := case p_currency when 'USD' then 'caisse_usd' else 'caisse_cdf' end;

  select coalesce(round(sum(amount), 2), 0)
    into v_opening
    from public.opening_balances
   where account = v_payment_account and currency = p_currency;

  select round(coalesce(sum(
    case when direction = 'recette'
           then case p_currency when 'USD' then amount_usd else amount_cdf end
         else -case p_currency when 'USD' then amount_usd else amount_cdf end
    end
  ), 0), 2)
    into v_moves
    from public.erp_transactions
   where entry_date <= current_date
     and payment_account = v_payment_account
     and validation_status = 'valide';

  v_theoretical := round(v_opening + v_moves, 2);
  v_discrepancy := round(v_counted - v_theoretical, 2);

  -- Statut déterminé par l'écart réel : conforme seulement si la caisse comptée
  -- égale la caisse attendue. Un écart documenté reste traçable, jamais masqué.
  if v_discrepancy = 0 then
    v_status := 'conforme';
  elsif nullif(trim(coalesce(p_justification, '')), '') is not null then
    v_status := 'ecart_justifie';
  else
    v_status := 'anomalie';
  end if;

  v_justification := concat_ws(
    E'\n',
    nullif(trim(coalesce(p_justification, '')), ''),
    'Solde d’ouverture ' || v_payment_account || ' retenu : ' ||
      to_char(v_opening, 'FM999999999990.00') || ' ' || p_currency ||
      case when not exists (
             select 1 from public.opening_balances
              where account = v_payment_account and currency = p_currency
           ) then ' (aucun solde d’ouverture configuré — clôture non conforme possible tant que R4-22 n’est pas levé)' else '' end,
    'Mouvements validés cumulés jusqu’au ' || to_char(current_date, 'YYYY-MM-DD') || ' : ' ||
      to_char(v_moves, 'FM999999999990.00') || ' ' || p_currency
  );

  v_reference := 'PV-CLOT-' || p_currency || '-' ||
    to_char(current_date, 'YYYYMMDD') || '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.cash_closures (
    closure_date, currency, theoretical_balance, counted_balance, discrepancy,
    justification, closed_by, pv_reference, status
  ) values (
    current_date, p_currency, v_theoretical, v_counted, v_discrepancy,
    v_justification, v_uid, v_reference, v_status
  )
  returning * into v_closure;

  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_CASH_CLOSURE_RECORDED', 'cash_closures', v_closure.id::text, 'success',
      jsonb_build_object(
        'pv', v_closure.pv_reference,
        'currency', v_closure.currency,
        'opening_balance', v_opening,
        'theoretical_balance', v_closure.theoretical_balance,
        'counted_balance', v_closure.counted_balance,
        'discrepancy', v_closure.discrepancy,
        'status', v_closure.status
      ));

  return v_closure;
end;
$$;

-- Le visa DAF approuve et trace ; il n'invente ni ne déclasse aucun statut.
create or replace function public.closure_validate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid; v_cl public.cash_closures%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentification requise.';
  end if;
  if not public.has_permission('erp.validate') then
    raise exception 'permission refusée (erp.validate requis).';
  end if;
  select * into v_cl from public.cash_closures where id = p_id;
  if not found then
    raise exception 'clôture introuvable ou non autorisée.';
  end if;
  if v_cl.validated_by is not null then
    raise exception 'clôture déjà validée (immuable).';
  end if;

  update public.cash_closures
     set validated_by = v_uid,
         validated_at = now()
   where id = p_id;

  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_CASH_CLOSURE_VALIDATED', 'cash_closures', p_id::text, 'success',
      jsonb_build_object('pv', v_cl.pv_reference, 'status', v_cl.status));
end;
$$;

revoke all on function public.opening_balance_set(text, text, numeric) from public;
grant execute on function public.opening_balance_set(text, text, numeric) to authenticated, service_role;
grant execute on function public.closure_create(text, numeric, text) to authenticated, service_role;
grant execute on function public.closure_validate(uuid) to authenticated, service_role;

-- Contrôles avant application (lecture seule) :
--   select has_function_privilege('authenticated','public.closure_create(text,numeric,text)','EXECUTE');
--     attendu : true (sinon 023 n'est pas appliquée : l'appliquer avant cette 027)
--   select pg_get_functiondef('public.closure_validate(uuid)'::regprocedure) like '%anomalie%';
--     attendu : true avant 027 (corps 023), false après
--   select account, currency, amount from public.opening_balances order by account;
--     attendu : 0 ligne tant que le DAF n'a rien saisi
-- Contrôles après application :
--   select pg_get_functiondef('public.closure_validate(uuid)'::regprocedure) like '%status = ''anomalie''%';
--     attendu : false
--   un appel de test par un compte erp.validate doit créer une clôture 'conforme'
--   quand le comptage égale ouverture + mouvements validés.
-- Retour arrière : réappliquer 20261020_023 (bodies précédents) puis
--   drop function public.opening_balance_set(text, text, numeric);
