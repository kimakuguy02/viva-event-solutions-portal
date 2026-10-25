-- ============================================================================
-- VIVA — PACK D'APPLICATION 024 → 026 → 027
-- Mode d'emploi : coller UN BLOC à la fois dans l'éditeur SQL Supabase
-- (Dashboard → SQL Editor → New query → Run), lire le résultat attendu,
-- puis passer au bloc suivant. Ne jamais coller tout le fichier d'un coup.
--
-- Aucun bloc de ce fichier n'écrit quoi que ce soit tant que vous n'avez pas
-- volontairement exécuté une étape « APPLIQUER ». Les étapes APPLIQUER copient
-- le contenu d'un fichier de migration existant — source unique de vérité,
-- ce pack ne duplique pas le DDL pour éviter toute divergence.
--
-- Ordre imposé : P (contrôles) → 1 (024) → 2 (026) → 3 (027) → T (tests).
-- 027 doit venir APRÈS 023 (déjà appliquée selon le relevé distant).
-- ============================================================================


-- ============================================================================
-- BLOC P — CONTRÔLES AVANT TOUTE ÉCRITURE (lecture seule)
-- ============================================================================

-- P1. Permissions CRM déjà présentes ?  Attendu avant 024 : 0 ligne.
--     Attendu après 024 : 3 lignes (crm.create, crm.update, crm.view).
select code
from public.permissions
where code in ('crm.view', 'crm.create', 'crm.update')
order by code;

-- P2. Colonne traçable de l'auteur ?  Attendu avant 024 : 0 ligne ; après : 1 ligne.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'crm_interactions'
  and column_name = 'author_label';

-- P3. Politiques CRM en vigueur (nom seules, pas de contenu).
select polrelid::regclass as table_objet, polname as politique
from pg_policy
where polrelid in ('public.clients'::regclass,
                   'public.contacts'::regclass,
                   'public.crm_interactions'::regclass)
order by 1, 2;

-- P4. Fonctions finance existantes et exécutabilité.
--     Attendu avant 026/027 : closure_create + closure_validate présentes
--     (auth_can_execute = true prouve que 023 est bien appliquée) ;
--     opening_balance_set et erp_double_signature_required absentes.
select p.proname,
       pg_get_function_arguments(p.oid) as signature,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('closure_create', 'closure_validate',
                    'opening_balance_set', 'erp_double_signature_required',
                    'enforce_tx_initial_status')
order by p.proname;

-- P5. Le visa DAF déclasse-t-il la clôture qu'il approuve ?
--     Attendu : true (corps 023) → c'est le défaut R2 corrigé par 027.
select pg_get_functiondef('public.closure_validate(uuid)'::regprocedure)
       like '%anomalie%' as validate_ecrit_anomalie;

-- P6. Écritures sous seuil aujourd'hui coincées hors de la file d'approbation.
--     Attendu : un nombre >= 0. C'est le défaut R1 : ces lignes sont en base
--     avec un statut non valide alors que le navigateur les affichait « valide ».
select count(*) as tx_sous_seuil_non_valide
from public.erp_transactions
where requires_double_signature = false
  and validation_status <> 'valide';

-- P7. Trigger du statut initial, présent et actif ?
--     Attendu : trg_tx_initial_status / tgenabled = 'O'.
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.erp_transactions'::regclass
  and not tgisinternal
order by tgname;

-- P8. Soldes d'ouverture saisis ?  Attendu : 0 ligne tant que le DAF n'a rien saisi.
select account, currency, amount, set_at
from public.opening_balances
order by account, currency;

-- P9. Qui détient erp.validate ? (027 exige cette permission pour ses 3 RPC)
--     Attendu : au moins DAF_COMPTABLE et un rôle d'administration.
--     Si 0 ligne → ne pas appliquer 027 : aucune clôture ne serait validable.
select r.code as role, p.code as permission
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions p on p.id = rp.permission_id
where p.code = 'erp.validate'
order by r.code;

-- P10. État des clôtures déjà enregistrées (aucune ne sera modifiée par 027).
select status, count(*) as nombre
from public.cash_closures
group by status
order by 2 desc;

-- P11. Optionnel — historique tenu par la CLI Supabase.
--     Une erreur « schema supabase_migrations does not exist » est NORMALE si
--     vous avez toujours collé les migrations dans l'éditeur : ignorer.
select version
from supabase_migrations.schema_migrations
order by version;


-- ============================================================================
-- BLOC 1 — APPLIQUER 024 (CRM : permissions + auteur des interactions)
-- ============================================================================
-- ⚠ DECISION AVANT D'EXECUTER — ligne 33 du fichier 024 attribue crm.view /
--   crm.create / crm.update à SIX rôles, dont ADMIN_RH. Si vous ne voulez pas
--   que la DRH écrive dans le CRM, retirez la ligne 'ADMIN_RH', dans le fichier
--   supabase/migrations/20261024_024_crm_permissions_and_authors.sql
--   (section 1, liste des rôles) AVANT de copier-coller. Rien d'autre ne change.
--
-- Action : ouvrir supabase/migrations/20261024_024_crm_permissions_and_authors.sql
-- copier la TOTALITE, coller, Run.
--
-- Résultats attendus : exécution sans erreur ; les requêtes P1 (3 lignes),
-- P2 (1 ligne) et P4 ci-dessus refaites après coup montrent les nouvelles
-- politiques. Le dernier UPDATE ne touche que les échanges dont l'auteur est
-- déjà connu (author_label = ''), il n'invente ni ne supprime rien.
--
-- Retour arrière : les politiques recréées sont additives (erp.* conservé).
--   drop trigger if exists trg_crm_inter_author_label on public.crm_interactions;
--   drop function if exists public.set_crm_interaction_author_label();
--   delete from public.role_permissions rp
--     using public.permissions p, public.roles r
--    where rp.permission_id = p.id and rp.role_id = r.id
--      and p.code in ('crm.view','crm.create','crm.update');
--   delete from public.permissions where code in ('crm.view','crm.create','crm.update');
--   alter table public.crm_interactions drop column if exists author_label;
--   -- puis réappliquer les politiques clients/contacts/interactions de 005/017.


-- ============================================================================
-- BLOC 2 — APPLIQUER 026 (le serveur devient seul maître du seuil)
-- ============================================================================
-- Prerequis vérifiés en P7 (trigger actif) et P4 (enforce_tx_initial_status).
-- Aucune donnée existante n'est recalculée : seules les NOUVELLES écritures
-- bénéficient de la règle serveur. Le backfill des lignes déjà en base est une
-- décision distincte (voir « Reste à décider » plus bas), volontairement absent.
--
-- Action : ouvrir supabase/migrations/20261024_026_finance_server_authority.sql
-- copier la TOTALITE, coller, Run.
--
-- Contrôle après application :
select pg_get_functiondef('public.enforce_tx_initial_status()'::regprocedure)
       like '%erp_double_signature_required%' as seuil_cotserveur;
-- Attendu : true.

select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.erp_transactions'::regclass
  and tgname = 'trg_tx_initial_status';
-- Attendu : 1 ligne, tgenabled = 'O'.

-- La règle serveur ne doit PAS être appelable depuis l'application :
select has_function_privilege('authenticated',
       'public.erp_double_signature_required(text, numeric, numeric)', 'EXECUTE');
-- Attendu : false.

-- Retour arrière : réappliquer supabase/migrations/20261004_011_erp_guards.sql
--   puis drop function public.erp_double_signature_required(text, numeric, numeric);


-- ============================================================================
-- BLOC 3 — APPLIQUER 027 (clôtures conformes + solde d'ouverture)
-- ============================================================================
-- Prerequis : P4 doit avoir montré closure_create exécutable par authenticated
-- (preuve que 023 est appliquée) et P9 au moins un rôle avec erp.validate.
--
-- Action : ouvrir supabase/migrations/20261024_027_closure_conformity.sql
-- copier la TOTALITE, coller, Run.
--
-- Contrôles après application :
select pg_get_functiondef('public.closure_validate(uuid)'::regprocedure)
       like '%status = ''anomalie''%' as validate_declasse_toujours;
-- Attendu : false (le visa ne change plus le statut, il le trace).

select p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('opening_balance_set', 'closure_create', 'closure_validate')
order by p.proname;
-- Attendu : 3 lignes, auth_can_execute = true partout.

-- Retour arrière : réappliquer supabase/migrations/20261020_023_closure_create_rpc.sql
--   puis drop function public.opening_balance_set(text, text, numeric);
--   (les clôtures déjà créées avec 027 gardent leur contenu : rien n'est effacé)


-- ============================================================================
-- BLOC T — TESTS FONCTIONNELS (dans le portail, pas en SQL)
-- ============================================================================
-- T1. Session : un compte DG ou DAF connecté depuis Supabase ne doit PAS voir
--     la bannière « autorité legacy ». Si elle apparaît, 024 n'est pas appliquée
--     ou la session est retombée sur Express/Firebase → ne pas aller plus loin.
-- T2. Comptabilité → nouvelle écriture RECETTE de 50 USD. Attendu : le journal
--     affiche « Validée » (statut serveur, plus le choix du navigateur), et
--     l'écriture n'apparaît pas dans « visas en attente ».
-- T3. Nouvelle écriture DÉPENSE de 500 USD. Attendu : statut « En attente
--     manager », comptée dans la bannière « Règle Anti-Fraude : visas en
--     attente ». Visa Manager possible, puis visa DAF ; un même compte ne peut
--     pas poser les deux (séparation des fonctions 018).
-- T4. Trésorerie → définir un solde d'ouverture (ex. caisse_usd / USD / 0).
--     Attendu : message de succès, puis P8 montre la ligne. Sans solde, une
--     clôture reste possible mais le PV nomme explicitement l'absence d'ouverture.
-- T5. Clôture du jour : saisir un comptage égal au solde théorique → attendu
--     statut « conforme ». Saisir un comptage différent sans justification →
--     « anomalie ». Avec justification → « écart justifié ». Le bouton « Faire
--     viser la clôture » doit tracer une date de visa sans changer le statut.


-- ============================================================================
-- RESTE A DECIDER (aucune action ici, volontairement)
-- ============================================================================
-- 1. Backfill P6 : les écritures déjà bloquées sous seuil restent dans leur
--    état actuel. Corriger l'historique = UPDATE sur des pièces comptables,
--    donc décision explicite + audit. Demandez le SQL si vous le voulez.
-- 2. 025 (texte de bienvenue) : la méthode retenue est la publication depuis
--    l'éditeur CMS, pas ce SQL. Le fichier reste un secours.
-- 3. Billetterie : aucune commande n'est enregistrée à ce jour (le « e-billet »
--    est fabriqué côté écran). Nécessite une table de réservations + un canal
--    de paiement : fonctionnalité à commander, pas une correction.
