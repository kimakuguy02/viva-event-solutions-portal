-- VIVA — Migration 026 : le serveur devient la seule autorité du seuil anti-fraude.
-- Constat d'audit R1 (confirmé) : `requires_double_signature` et le statut initial
-- étaient décidés par le navigateur. Le trigger 011 de 20261004 ramenait de toute
-- façon tout INSERT non-c contrepassation à `en_attente_manager`, alors que l'UI
-- affichait `valide` pour les montants sous seuil et filtrait sa file d'attente sur
-- ce même flag client. Résultat : une dépense sous seuil était présentée comme
-- validée, restait `en_attente_manager` en base, et n'apparaissait dans aucune file
-- d'approbation — blocage silencieux et journal divergent de la base.
--
-- ADDITIF : aucune donnée modifiée, aucune colonne supprimée, aucun DROP de policy.
-- Rejouable (create or replace + drop trigger if exists).
-- Prérequis : 004 (erp_transactions), 011 (enforce_tx_initial_status), 018 (RPC visas).

-- Seul le serveur connaît la règle. Fonction pure, non exposée en RPC.
create or replace function public.erp_double_signature_required(
  p_direction text,
  p_amount_usd numeric,
  p_amount_cdf numeric
)
returns boolean
language sql
as $$
  select p_direction = 'depense'
     and (coalesce(p_amount_usd, 0) > 100 or coalesce(p_amount_cdf, 0) > 285000);
$$;

revoke all on function public.erp_double_signature_required(text, numeric, numeric)
  from public, anon, authenticated;
-- Le trigger appelant est SECURITY DEFINER (propriétaire postgres) : il conserve
-- l'exécution sans que la règle soit appelable depuis PostgREST.

-- Le flag et le statut initial sont recalculés à partir des montants réellement
-- stockés, jamais de ce que le navigateur a envoyé.
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

  -- Autorité serveur sur le seuil : le flag client est ignoré puis réécrit.
  new.requires_double_signature :=
    public.erp_double_signature_required(new.direction, new.amount_usd, new.amount_cdf);

  -- Contrepassation (018.erp_reverse_tx) : la pièce inverse est déjà double-signée
  -- par son visa d'origine ; exemption conservée, sinon erp_reverse_tx casserait.
  if new.reversed_by is not null then
    new.validation_status := 'valide';
  elsif new.requires_double_signature then
    new.validation_status := 'en_attente_manager';
  else
    -- Sous le seuil : visa unique admis (règle métier d'origine), et la recette
    -- n'est pas soumise à la double signature.
    new.validation_status := 'valide';
  end if;

  -- Le client ne choisit jamais les visas : remis à NULL à la création, y compris
  -- pour un validateur. Les visas ne sont posés que par les RPC 018 (UPDATE).
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

-- Contrôles avant application (lecture seule, à exécuter par le pilote) :
--   select count(*) from public.erp_transactions
--     where requires_double_signature = false and validation_status <> 'valide';
--     -> nombre d'écritures aujourd'hui invisibles dans la file d'approbation.
--   select pg_get_functiondef('public.enforce_tx_initial_status()'::regprocedure);
--     attendu : corps sans appel à public.erp_double_signature_required avant 026.
--   select tgname, tgenabled from pg_trigger where tgrelid = 'public.erp_transactions'::regclass;
-- Retour arrière : réappliquer 20261004_011_erp_guards.sql seul (le corps précédent
-- est intégralement défini là-dedans), puis drop function erp_double_signature_required.
