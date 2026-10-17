# VIVA EVENT SOLUTIONS PORTAL
# PHASE 1 — FONDATIONS & ARCHITECTURE

## 1. Objectif

Figer l'architecture cible et les fondations (docs, client central, règles),
sans toucher aux flux runtime. Référence : `VIVA_PRODUCTION_AUDIT.md`.

## 2. État avant Phase 1

Prototype UI avancé, 5+ sources de vérité, Firebase+Express actifs, Supabase
connecté mais base distante vide, 7 migrations locales non déployées, bypass
auth critiques, RBAC frontend seul, 0 test, 0 CI.

## 3. Décision Supabase comme unique source de vérité

Actée RULE-001 (`docs/ARCHITECTURE_RULES.md`). Toute nouvelle donnée métier :
PostgreSQL (+RLS) et/ou Storage. Firebase/Express/JSON/localStorage/IndexedDB
ne reçoivent plus aucune nouvelle donnée métier (gel immédiat, retrait phasé).

## 4. Architecture cible

`docs/VIVA_ARCHITECTURE.md` §1-20 : React → Supabase Auth → Profiles/Roles/
Permissions → RLS → PostgreSQL → Storage/Edge → Gemini (avec confirmation
humaine). Offline = IndexedDB cache/queue, vérité = Supabase.

## 5. Modifications réalisées

Aucune modification de flux runtime. Gel acté par documentation opposable.
`.env.example` déjà conforme (vérifié, inchangé). Client Supabase vérifié
(unique, `VITE_*` anon seule, pas de `service_role` — 1 seul hit = commentaire
d'interdiction). Aucun service DAL créé (volontaire : pas de coquilles vides ;
carte ci-dessous).

## 6. Fichiers créés

`docs/VIVA_ARCHITECTURE.md`, `docs/ARCHITECTURE_RULES.md`,
`docs/SECURITY_ARCHITECTURE.md`, `docs/GEMINI_ARCHITECTURE.md`,
`docs/LEGACY_MIGRATION.md`, `VIVA_PHASE_1_REPORT.md`.

## 7. Fichiers modifiés

Aucun fichier source modifié.

## 8. Supabase

Client central unique OK. Migrations 001→007 inspectées : ordre strict,
dépendances (002→001, 005→004+002, 006→002, 007→001/004), idempotentes
(`IF NOT EXISTS`, `ON CONFLICT`, `DROP POLICY IF EXISTS`). LOCAL ≠ REMOTE
(base vide vérifiée) — déploiement = prérequis Phase 2, jamais prétendu.

## 9. Authentification

Préparée (cartographie §12) : Firebase Auth (`AuthContext:223-387`), Express
HMAC (`server/auth.ts`, `apiClient`), `loginAsClient:440`, `setUserRole:426`,
`BOOTSTRAPPED_ADMIN_EMAILS:109-114`, OTP simulé, token localStorage 8h.
Cible : Supabase Auth + `profiles` + trigger CLIENT (déjà écrit en 002).

## 10. RBAC

Préparé : 9 codes canoniques + matrice 003 (SUPER_ADMIN complet, autres
scopés), helpers `has_permission/is_super_admin`, trigger anti-escalade.
Enforcement réel = Phase 2 (Auth) puis 3-5 (domaines).

## 11. Data Access Layer

Carte cible (création aux phases indiquées, pas de shells vides) :
`authService, profileService` (Ph.2), `cmsService, menuService, moduleService,
formService, mediaService, organizationService, settingsService` (Ph.3-4),
`clientService, projectService, quoteService` (Ph.5), `erpService` via RPC
(Ph.5), `auditService` serveur seul (Ph.8). Règle : composants sans SQL direct.

## 12. Types

Legacy à conserver jusqu'à migration : `UserRole` 18 valeurs (`types/index.ts`,
`types/erp.ts`), `DirectionOrg` vs `OrganizationUnit`, `SYSTEM_PERMISSIONS`,
`ERP_RBAC_PERMISSIONS`. Cible : types générés Supabase → types domaine → types
UI. `any` : `ProjectDataContext` (`firestoreData: any`), `syncService`
(`data: any`), `apiClient` (`ApiResponse<T=any>`) — à typer aux phases de
migration. Aucun type supprimé.

## 13. Storage

Buckets 006 + policies documentés (`docs/VIVA_ARCHITECTURE.md` §7).
Firebase Storage reste runtime jusqu'à Phase 6 (gel nouveautés immédiat).

## 14. Offline

Architecture formalisée (§10 archi) : Supabase vérité, IndexedDB cache/queue,
flush contrôlé, serveur gagne, `last-write-wins` = temporaire documenté.
`sync/push` Express marqué à sécuriser puis remplacer (SEC-04).

## 15. Security

`docs/SECURITY_ARCHITECTURE.md` : 14 findings SEC-01→14 avec phases. Aucun
corrigé en Phase 1 (documentés, non prétendus corrigés).

## 16. Gemini

`docs/GEMINI_ARCHITECTURE.md` : contrat Edge + confirmation + RBAC + audit.
Aucun code (Phase 7).

## 17. Legacy

`docs/LEGACY_MIGRATION.md` : table complète, cibles et phases de retrait.
Firebase colonne LEGACY uniquement.

## 18. Tests

`tsc --noEmit` + `build` (résultats §19). Aucun test ajouté (Phase 9).

## 19. Build

Résultats d'exécution en fin de phase (ci-dessous).

## 20. Risques restants

Les 9 production blockers Phase 0 restent ouverts (auth, RLS inactive distant,
secrets versionnés, audit forgeable, démo/PII). Le risque nouveau serait de
croire les fondations = la migration : les docs n'exécutent rien.

## 21. Pré-requis Phase 2

1. Déployer 001→007 distant + vérification réelle. 2. Corriger `.env.local`
(persister `VITE_*`). 3. Rotation secrets + purge historique. 4. Migrer
`AuthContext` vers Supabase Auth + supprimer bypass. 5. Sécuriser ou geler
`/api/sync/push`.
