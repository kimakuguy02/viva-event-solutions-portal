-- Clôture de caisse : calcul serveur et suppression de l'INSERT direct.
-- Le navigateur fournit uniquement devise, comptage physique et justification.

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

  v_payment_account := case p_currency
    when 'USD' then 'caisse_usd'
    else 'caisse_cdf'
  end;

  select round(coalesce(sum(
    case
      when direction = 'recette' then
        case p_currency when 'USD' then amount_usd else amount_cdf end
      else
        -case p_currency when 'USD' then amount_usd else amount_cdf end
    end
  ), 0), 2)
  into v_theoretical
  from public.erp_transactions
  where entry_date = current_date
    and payment_account = v_payment_account
    and validation_status = 'valide';

  v_discrepancy := round(v_counted - v_theoretical, 2);
  v_justification := concat_ws(
    E'\n',
    nullif(trim(coalesce(p_justification, '')), ''),
    'Solde théorique calculé à partir des mouvements enregistrés uniquement ; aucun solde d’ouverture n’est configuré.'
  );
  v_status := 'anomalie';
  v_reference := 'PV-CLOT-' || p_currency || '-' ||
    to_char(current_date, 'YYYYMMDD') || '-' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.cash_closures (
    closure_date,
    currency,
    theoretical_balance,
    counted_balance,
    discrepancy,
    justification,
    closed_by,
    pv_reference,
    status
  ) values (
    current_date,
    p_currency,
    v_theoretical,
    v_counted,
    v_discrepancy,
    v_justification,
    v_uid,
    v_reference,
    v_status
  )
  returning * into v_closure;

  insert into public.audit_logs (
    actor_user_id, action, resource, resource_id, result, metadata
  ) values (
    v_uid,
    'ERP_CASH_CLOSURE_RECORDED',
    'cash_closures',
    v_closure.id::text,
    'success',
    jsonb_build_object(
      'pv', v_closure.pv_reference,
      'currency', v_closure.currency,
      'theoretical_balance', v_closure.theoretical_balance,
      'counted_balance', v_closure.counted_balance,
      'discrepancy', v_closure.discrepancy
    )
  );

  return v_closure;
end;
$$;

-- Sans solde d'ouverture, la comparaison aux seuls mouvements ne peut pas
-- établir la conformité. La validation DAF trace l'approbation sans effacer
-- cet état incomplet.
create or replace function public.closure_validate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_cl public.cash_closures%rowtype;
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
        validated_at = now(),
        status = 'anomalie'
    where id = p_id;

  insert into public.audit_logs (actor_user_id, action, resource, resource_id, result, metadata)
    values (v_uid, 'ERP_CASH_CLOSURE_VALIDATED', 'cash_closures', p_id::text, 'success',
      jsonb_build_object('pv', v_cl.pv_reference));
end;
$$;

-- Les clôtures authentifiées ne peuvent plus être insérées avec des montants
-- ou un statut fournis directement par le navigateur.
drop policy if exists closures_staff_write on public.cash_closures;
revoke insert on table public.cash_closures from authenticated;
revoke all on function public.closure_create(text, numeric, text) from public;
grant execute on function public.closure_create(text, numeric, text) to authenticated, service_role;

-- Contrôles post-déploiement :
--   select has_table_privilege('authenticated', 'public.cash_closures', 'INSERT');
--     attendu : false
--   select has_function_privilege('authenticated', 'public.closure_create(text,numeric,text)', 'EXECUTE');
--     attendu : true
