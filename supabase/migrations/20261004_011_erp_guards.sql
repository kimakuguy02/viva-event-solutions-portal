-- VIVA — Migration 011 : garde anti-contournement double-signature
-- Constat Wave 2 (R3-4) : la policy tx_staff_write autorise l'INSERT avec un
-- validation_status arbitraire — un rôle avec erp.create mais sans erp.validate
-- pouvait insérer directement une transaction 'valide' et contourner la double
-- signature. Ce trigger force le statut initial selon les permissions réelles.
-- Idempotent. Ne touche à aucune donnée existante.

create or replace function public.enforce_tx_initial_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service_role / owner (seeds, Edge admin) : confiance, passage direct.
  if auth.uid() is null then
    return new;
  end if;
  -- Seul un validateur (erp.validate) peut créer une écriture déjà 'valide'
  -- (ex. contrepassation émise par un DAF via RPC/Edge).
  if new.validation_status = 'valide' and not public.has_permission('erp.validate') then
    new.validation_status := case
      when new.requires_double_signature then 'en_attente_manager'
      else 'en_attente_manager'
    end;
  end if;
  -- Le client ne choisit jamais les visas : remis à NULL à la création.
  if not public.has_permission('erp.validate') then
    new.manager_approved_by := null;
    new.daf_validated_by := null;
    new.daf_validated_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tx_initial_status on public.erp_transactions;
create trigger trg_tx_initial_status
  before insert on public.erp_transactions
  for each row execute function public.enforce_tx_initial_status();
