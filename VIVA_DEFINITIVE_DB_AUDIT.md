# VIVA DEFINITIVE DB — AUDIT (Étape 1, read-only)
> Aucun fichier applicatif modifié, aucune migration créée/exécutée, aucune
> donnée touchée. Vérifié le 06/10/2026.

## 1. Migrations locales (11 fichiers, ordre strict)
001_rbac (4 tables + index + `set_updated_at`) → 002_rls (RLS + 4 helpers
SECURITY DEFINER + anti-escalade + trigger signup + REVOKE/GRANT) →
003_seed_rbac (9 rôles, ~52 permissions, matrice) → 004_business_schema
(21 tables) → 005_business_rls (41 policies + 2 triggers immutabilité) →
006_storage (5 buckets + 7 policies) → 007_business_seed (DIR-01→09, youtube
désactivée, 4 settings) → 008_grants (TABLE-level, trouvé par TEST 2) →
009_isolation_fix (3 perms `*.manage` + 6 policies resserrées, trouvé par TEST 2) →
010_audit_actor (acteur serveur) → 011_erp_guards (statut initial forcé).
Cohérence inter-fichiers vérifiée : dépendances, noms, idempotence
(`IF NOT EXISTS`/`ON CONFLICT`/`DROP IF EXISTS`), 0 motif destructif.

## 2. Schéma distant vérifié (lecture seule, clé anon)
- Tables présentes : `org_units` (≥1 ligne), `cms_sections` (0 ligne).
- Refus 42501 sur `roles/permissions/profiles/app_settings` pour anon =
  **comportement attendu** (GRANT limités + RLS) : prouve que GRANT (008) et
  RLS sont actifs. Distant conforme aux migrations 001→011.
- Non vérifiable sans privilèges : contenu `auth.users`, policies exactes
  (`pg_policies`), triggers au-delà du fonctionnel déjà testé (001→009 validés
  en réel : isolation A↔B, anti-escalade, seeds, buckets). Marqué INCONNU si
  non prouvé, jamais supposé.

## 3. Services Supabase (code) — requêtes réelles
`settingsService` (get/upsert + relecture + audit), `auditService`,
`cmsService` (sections/versions, appariement `content_key`), `menuModuleService`
(menus par `code`, modules + `config` JSONB), `formOrgService` (forms/fields/
submissions/org_units), `mediaService` (métadonnées + `youtube_config`),
`businessService` (projects par `code`, quotes par `reference_number`),
`erpService` (tx par `piece_reference`, tasks UUID, closures, clients par `code`).
Toutes les écritures exigent session, propagent l'erreur, relisent après écriture.

## 4. Contextes & modèles TS
`AuthContext` (Supabase-first + repli legacy marqué), `ProjectDataContext`
(overlay PG-gagne + miroir), `EnterpriseErpContext` (inserts PG-first, transitions
sans policy UPDATE → RPC à venir). Types : `index.ts` (Project étendu vague 2 :
milestones/deliverables/team/priority/archived), `erp.ts`, `cmsAndErp.ts`
(+`helpText`/`validation`), `platformBuilder.ts` (achats, événements domaine).

## 5. Sources legacy
Firestore 16 collections (lecture/écriture + miroirs), Express JSON
(`sync/push` ouvert — bloqueur), localStorage ~25 clés (cache + SSOT de fait),
IndexedDB ×2 (ERP + queue), `INITIAL_*` + démos (PII à purger). Authentification
legacy en repli (auto-désactivé au déploiement vérifié).

## 6. Écarts code ↔ migrations ↔ distant
- Champs TS sans colonne PG : `caption/projectName/uploadedBy` (médias),
  `helpText/validation` (champs), `detailedMilestones/Deliverables/team`
  (projets, miroir seul), `submissionsCount`, `module/client/project` (types de
  champ), contacts/ vifaa annexes mémoire.
- Tables cibles absentes : `equipment, partners, departments, crm_interactions,
  contacts, tickets(+messages), notifications(+prefs), workflows(+steps/
  instances/transitions), notifications, ai_actions, security_events,
  suppliers(+contacts/orders), purchases(+lines/orders), ohada_accounts,
  journal_entries/journals, treasury/opening/reconciliations, projects membres,
  milestones, milestones, media metadata JSONB, albums/realizations, pages/seo_meta,
  form_workflows, org_memberships, notifications prefs, sync op log.
- `user_permissions` mentionnée, absente : à trancher (créer ou retirer des specs).
- RLS 009 vs matrice 003 : `*.manage` créées en 009, matrice étendue en 009 —
  cohérent. `menus.manage` mono-rôle (ADMIN_GENERAL) : élargissement à décider.
