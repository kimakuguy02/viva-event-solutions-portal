# VIVA EVENT SOLUTIONS PORTAL
# PHASE 3 — SUPABASE CORE

> Statut : **PARTIELLEMENT EXÉCUTÉE — NON FULLY VALIDATED**.
> Distant vide vérifié ce jour (`PGRST205` sur toutes les tables).
> Aucune simulation : tout ce qui est marqué REMOTE est NON DÉPLOYÉ.

## 1. Objectif

Passer de « Supabase préparé » à « Supabase opérationnel ». Bloqué par
l'absence de déploiement distant : fondations locales vérifiées, procédure
manuelle fournie, aucun faux succès.

## 2. État initial

Phases 0-2 terminées : AuthContext Supabase-first, 7 migrations locales
inspectées, RLS/Storage écrits, distant vide, bypass supprimés du chemin actif.

## 3. État du remote Supabase

- Connexion API : OK (projet répond, anon key valide).
- Schéma : VIDE — `roles/permissions/profiles/org_units/app_settings/
  cms_sections` → `PGRST205`. Buckets : liste vide.
- Capacités de cet environnement : REMOTE ACCESS (lecture API) AVAILABLE ;
  DDL NOT AVAILABLE ; AUTH ADMIN NOT AVAILABLE ; STORAGE ADMIN NOT AVAILABLE
  (clé anon seule, pas de `service_role`, pas de mot de passe DB, pas de CLI lié).
- Verdict : **REMOTE = NOT DEPLOYED**. Aucune table/fonction/policy testable.

## 4. Migrations

001→007 inspectées intégralement (contenu affiché et validé en phase
précédente) : ordre strict respecté, dépendances (002→001, 005→004+002,
006→002, 007→001/004), 0 motif destructif, idempotence (`IF NOT EXISTS`,
`ON CONFLICT` ×12+, `DROP ... IF EXISTS`). Aucune duplication, un seul RBAC,
un seul modèle `profiles`. Non réécrites, non dupliquées.

## 5. PostgreSQL

LOCAL : 25 tables (4 RBAC + 21 métier), UUID, FK, CHECK, UNIQUE, index,
triggers `updated_at`/immutabilité. REMOTE : 0 table. Dérive fidèle des types
(`CmsSectionItem`, `DynamicMenu/Module/Form`, `OrganizationUnit`, `CrmClient`,
`AccountingTransaction`, `QuoteRequest`, `Project`).

## 6. Auth

Supabase Auth primaire (code Phase 2), distant sans `auth.users` métier
(base vide). Trigger `handle_new_user` écrit, non actif distant.

## 7. Profiles

Modèle `id=auth.users.id`, `role_id`, `status`, timestamps. REMOTE : absent.

## 8. Roles

9 codes canoniques en seeds 003 (matrice complète). REMOTE : absents.
Aucun doublon (`admin` fusionné dans `SUPER_ADMIN`, `ADMIN_GENERAL` = DG
historique). Rôles techniques legacy (`project_manager`…) exclus du seed,
à modéliser en `org_units` si besoin.

## 9. Permissions

~52 codes (17 legacy intacts + extensions), matrice par rôle scopée
(SUPER_ADMIN complet, CLIENT/VISITOR minimaux). REMOTE : absentes.

## 10. RLS

Écrite (002 + 005, 48 policies), deny-by-default, helpers `SECURITY DEFINER`
`search_path` verrouillé + `REVOKE/GRANT` explicites. REMOTE : inactive.
Matrice par table (détail §12-21 du rapport 3B/chantier 2 — inchangée).
Failles résiduelles identifiées (non simulées, à durcir) :
R3-1 `audit_insert WITH CHECK(true)` — `actor_user_id` forgeable (forcer
`auth.uid()` par trigger, Phase 8) ; R3-2 `quotes/form_submissions INSERT`
publics — `submitted_by` forgeable (Edge + rate-limit, Phase 8) ;
R3-3 `youtube_config USING(true)` — singleton non sensible, acceptable.

## 11. Storage

Schéma 006 + buckets `media, cms` (publics) / `quotes, erp, signatures`
(privés), 7 policies RBAC. REMOTE : 0 bucket. Firebase Storage reste le
runtime (gel nouveautés).

## 12. CMS

Tables `cms_sections/versions` OK local ; workflow draft→publish→archive
compatible contexte actuel. REMOTE : absent.

## 13. Menus

`menus` hiérarchique + `required_permission` OK local. REMOTE : absent.

## 14. Modules

`modules` + `module_permissions` normalisée OK local. REMOTE : absent.

## 15. Forms

`forms/fields/submissions` (16 types) OK local. REMOTE : absent.

## 16. Clients

`clients` + `owner_profile_id` OK local. `contacts` dédiés : à prévoir si
confirmé Phase 5 (suivi actuel par catégorie/statut). REMOTE : absent.

## 17. Projects

`projects` + `lead_profile_id`, vitrine via médias/CMS (pas de lecture anon).
REMOTE : absent.

## 18. Quotes

`quotes/items`, montants `numeric` CHECK ≥ 0, insert public + owner-read.
REMOTE : absent.

## 19. ERP

`erp_tasks/transactions/cash_closures`, double-signature, trigger
immutabilité `valide`, contrepassation à venir en RPC (Phase 5).
REMOTE : absent.

## 20. Audit

`audit_logs` append-only (trigger anti update/delete), lecture own ou
`audit.view`. Durcissement acteur (R3-1) en Phase 8. REMOTE : absent.

## 21. Settings

`app_settings` (general/branding/finance/features/contact). Restent en
localStorage : `viva_feature_flags`, `viva_exchange_rate`, thèmes
(non critiques) — migration Phase 4.

## 22. Tests de sécurité

REMOTE : NON TESTABLE (visitor/client/staff/managers/super-admin,
escalade, IDOR A↔B, storage privé — tous en attente du déploiement).
LOCAL : revue statique des policies (matrice chantier 2, findings R3-1/2/3).

## 23. Tests de persistance

NON TESTABLE distant. Procédure prête (insert contrôle → reload → vérif,
puis suppression si policy l'autorise, sans polluer la prod).

## 24. Tests Storage

NON TESTABLE distant (0 bucket). Faux succès Firebase documenté (à
supprimer Phase 6 : erreur = erreur).

## 25. Legacy encore utilisé

Firebase Auth/Firestore/Storage + Express + JSON + localStorage/IndexedDB =
runtime intégral (gel nouveautés respecté : 0 ajout). `sync/push` toujours
ouvert (SEC-04 → Phase 8).

## 26. Backup / Recovery

STATUS = NOT CONFIGURED (PITR, staging, plan de récupération à définir
Phase 9 ; activer les backups Supabase dès le déploiement).

## 27. TypeScript

`npx tsc --noEmit` : PASS (exit 0, 0 erreur).

## 28. Build

`npm run build` : PASS (exit 0, ~17-20s, warning chunk 2 Mo préexistant).

## 29. Risques restants

Distant vide (bloque tout), secrets versionnés, R3-1/R3-2 à durcir,
`sync/push` ouvert, PII démo, OTP DAF simulé, last-write-wins, 0 test, 0 CI.

## 30. Pré-requis Phase 4

1. Exécuter 001→007 dans SQL Editor (procédure ci-dessous). 2. Créer le
 premier SUPER_ADMIN en SQL. 3. Revérifier 3B réel + durcir R3-1/R3-2.
 4. Migrer `ProjectDataContext` (priorité CMS/settings/media en lecture).

### Procédure de déploiement manuel (propriétaire Supabase)

1. Ouvrir le projet Supabase → SQL Editor (pas de reset, pas de DROP).
2. Exécuter dans l'ordre : `001_rbac` → `002_rls` → `003_seed_rbac` →
   `004_business_schema` → `005_business_rls` → `006_storage` →
   `007_business_seed`. S'arrêter à la première erreur, la signaler.
3. Vérifier : `select code from roles;` (9 lignes), `select count(*) from
   permissions;` (~52), `select * from org_units;` (DIR-01→09),
   `select * from storage.buckets;` (5 buckets).
4. Vérifier RLS : `select tablename, rowsecurity from pg_tables where
   schemaname='public';` (tout `true`), policies dans `pg_policies`.
5. Créer le premier SUPER_ADMIN : créer l'utilisateur via Authentication →
   copier son UUID → `insert into profiles ...` via `service_role`/SQL
   avec le `role_id` de `SUPER_ADMIN` (jamais via l'app).
