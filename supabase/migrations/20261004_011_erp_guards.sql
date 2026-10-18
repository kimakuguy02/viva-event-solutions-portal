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
  -- Une ecriteure creee « valide » par une session n'est legitime que si c'est une
  -- contrepassation emise par erp_reverse_tx (reversed_by renseigne). L'exemption
  -- « erp.validate » de la version d'origine laissait un seul compte DAF inserer
  -- une piece validee avec ses propres visas en un seul appel : la separation des
  -- fonctions des RPC 018 etait contournable par INSERT direct.
  if new.validation_status = 'valide' and new.reversed_by is null then
    new.validation_status := 'en_attente_manager';
  end if;
  -- Le client ne choisit jamais les visas : remis a NULL a la creation, y compris
  -- pour un validateur. Les visas ne sont poses que par les RPC 018 (UPDATE).
  new.manager_approved_by := null;
  new.daf_validated_by := null;
  new.daf_validated_at := null;
  return new;
end;
$$;

drop trigger if exists trg_tx_initial_status on public.erp_transactions;
create trigger trg_tx_initial_status
  before insert on public.erp_transactions
  for each row execute function public.enforce_tx_initial_status();
