# VIVA EVENT SOLUTIONS PORTAL
# AUDIT COMPLET — PHASE 0

> Statut : lecture seule. Aucune modification du code, aucune migration appliquée,
> aucune dépendance installée. Document généré le 2026-10-03.

## 1. Executive Summary

VIVA EVENT SOLUTIONS PORTAL est un SPA React 19 + Vite 6 + Tailwind 4 adossé à
**trois backends concurrents** : Firebase (Auth/Firestore/Storage, actif et réellement
utilisé), Express + JSON fichier (actif), Supabase (client créé, schéma 001→007 écrit
en local mais **non déployé à distance** — base distante vide vérifiée : `PGRST205`).

L'interface est riche (vitrine publique, portail client, ERP, Super Admin 19 onglets,
CMS draft/publish, builders menus/modules/formulaires, médias/YouTube) mais la
persistance réelle repose sur Firestore + `localStorage`/`IndexedDB`, avec des
**bypass d'authentification critiques côté frontend** (`loginAsClient`, `setUserRole`,
auto-promotion `admin_general` par email). Le RBAC n'est imposé nulle part côté
serveur/base pour les flux applicatifs. **Non déployable en production en l'état.**

## 2. État général du projet

- Stack : `react@19`, `firebase@12.19.0`, `express@4.21.2`, `@supabase/supabase-js@2.117.2`
  (installé, non utilisé par les flux), `@google/genai@2.4.0` (installé, 0 appel),
  `vite@6`, `tailwindcss@4`. `package.json` : scripts `dev/build/start/preview/lint(=tsc)`.
- Pas de tests projet, pas de CI (`.github` absent), pas de Docker, pas de
  `vercel.json`/`netlify.toml`, pas de `package-lock` (uniquement `bun.lock`).
- Maturité : prototype UI avancé, fondations Supabase écrites mais non branchées.
- Risques majeurs : 5+ sources de vérité divergentes, auth contournable, secrets
  versionnés, données démo/PII dans le code, audit falsifiable.

## 3. Architecture actuelle

```
React 19 SPA (src/App.tsx, routage par onglet local, pas de react-router)
 ├─ AuthContext        → Firebase Auth + fallback Express HMAC + bypass locaux
 ├─ ProjectDataContext → localStorage init + onSnapshot Firestore + setDoc direct
 ├─ EnterpriseErpContext → localStorage + IndexedDB + onSnapshot Firestore
 ├─ ThemeContext       → localStorage thèmes
 ├─ syncService/offlineDb → IndexedDB (2 DB) + queue localStorage → POST /api/sync/push
 └─ apiClient          → fetch /api Bearer (token localStorage viva_auth_token)
Express (server.ts + server/api.ts + server/auth.ts + server/db.ts)
 └─ JSON fichier data/viva_database.json (users/sessions/erp/cms/audit 1000 max)
Firebase (src/services/firebase.ts) : Auth email+Google, Firestore (DB id ai-studio-…),
 Storage (storageService.ts, fallback URL forgée en cas d'échec)
Supabase : src/services/supabase.ts (client seul, supabase=null sans env) ;
 migrations locales 001→007 NON déployées (distant vide vérifié)
Statique : src/data/*.ts (mocks), src/types/*.ts
```

## 4. Architecture cible

React/Vite → Supabase Auth → PostgreSQL + RLS (+RPC/Edge pour le sensible) →
Supabase Storage → Edge Functions (Gemini, double-signature, seeds) → Gemini avec
contexte RBAC. `IndexedDB`/`localStorage` = cache/queue uniquement. Firebase/Express/
JSON décommissionnés après cutover validé.

## 5. Cartographie des sources de vérité

| Donnée | Source actuelle | Lecture | Écriture | Persistance | Sécurité | SSOT réelle |
|---|---|---|---|---|---|---|
| Utilisateurs/profils | Firestore `users` + Express `users[]` + `localStorage viva_managed_users` | contexts + `GET /users` | setDoc direct / `POST /users` / local | Firestore cloud + JSON disque + navigateur | RLS Firestore partielles, Express par permission, local aucune | **AUCUNE (3 divergentes)** |
| Rôles/permissions | Constantes (`SYSTEM_PERMISSIONS`, `ERP_RBAC_PERMISSIONS`, `UserRole` 18 valeurs) + Firestore docs | UI | UI locale | Code + Firestore | Aucune (frontend) | Code |
| CMS/menus/modules/forms/médias/orga | Firestore + localStorage `viva_*` + `INITIAL_*` defaults | contexts (Firestore écrase local) | setDoc direct + local | Firestore + navigateur | Firestore rules (failles §8) | Firestore (fragile) |
| ERP (transactions, tâches, CRM) | Firestore + IndexedDB + localStorage + `INITIAL_*` | les 3 | les 3 | Les 3 (merge id, last-write-wins) | Validation **client** | AUCUNE |
| Audit | Firestore `audit_logs` + Express `auditLogs[]` + `localStorage viva_audit_logs` | 3 lecteurs | 3 writers (client forge tout) | Dispersée | Aucune | AUCUNE |
| Sessions/tokens | Firebase Auth + HMAC Express maison (`viva_auth_token` localStorage) | les deux | les deux | Firebase + JSON | 8h, logout ineffectif | AUCUNE |
| Fichiers | Firebase Storage (+ fallback URL forgée) | downloadURL | tout signé | Bucket | `isSignedIn` seul | Bucket (ouvert) |
| Supabase | Schéma local 001→007 | — | — | **Distant vide (PGRST205)** | RLS écrites, non actives | Cible, pas effective |

Divergences prouvées : `resetToDefaults()` réécrit Firestore + purge `viva_*` ;
`sync/push` écrase le JSON sans validation ; merges ERP par `id` sans conflit.

## 6. Cartographie frontend

- Framework React 19, Vite 6, Tailwind 4, `lucide-react`, `motion`. Pas de router
  (`currentTab` state + `window.location.hash #auth/admin-access` pour login admin
  caché — `App.tsx:105`). ~90 composants (`visitor×11, client×1, enterprise×10,
  admin×20, common×12, layout×3, media×1`). 4 contexts, 6 services, 3 fichiers types.
- Formulaires non contrôlés par librairie, validation inline (`ClientAuthModal`
  regex email/tél), `alert()` encore utilisés (`OnlineTicketingModule:633`,
  `OfficialAnnouncementsModule:219,265`, `InteractiveQuoteForm:325`,
  `RolesManagerModal:211,231`). `window.location.reload()` après reset
  (`ResetDatabaseModal:116`). Pas de `dangerouslySetInnerHTML`/`eval` détecté.
- États loading/empty/error incohérents (toasts artisanaux par écran). 62
  `console.*` (warnings de persistance masquant les échecs : `.catch(e => warn)`).

## 7. Cartographie backend

| Backend | Techno | Rôle réel | Auth | Statut |
|---|---|---|---|---|
| Firebase Auth | Google SDK | Login email/Google effectif | Firebase | ACTIF, SSOT session de facto |
| Firestore | NoSQL | Persistance runtime réelle | Rules (failles) | ACTIF |
| Firebase Storage | Bucket | Fichiers réels | `isSignedIn` seul | ACTIF, trop ouvert |
| Express (`server.ts/api/auth/db`) | Node | Login HMAC, CRUD users/cms/menus/settings, `sync/push`, audit | Bearer maison + `requirePermission` sauf `/sync/push` | ACTIF en `dev` (tsx) |
| Supabase | PG/RLS/Storage | Rien (client seul) | — | INACTIF distant |

Endpoints Express : `POST /auth/login|logout|change-password`, `GET /auth/me`,
`GET|POST /sync/pull|push` (**push sans autorisation**), `GET|PUT /cms/:id`,
`POST /cms/:id/rollback`, `PUT /organization|menus|modules|settings`,
`GET|POST|PUT|DELETE /users`, `GET /admin/audit-logs`. Pas de CORS/helmet/
rate-limit global (`cors|helmet|rateLimit` : 0 hit) ; `express.json 10mb`.

## 8. Authentification

- Réel : Firebase email/pass + Google (`AuthContext:292-387`), Express HMAC
  fallback (`ApiClient.login`), `onAuthStateChanged` + fallback `getMe`.
- Dangereux : `loginAsClient()` (aucun mot de passe, `ClientAuthModal:158-184`),
  `setUserRole()` (élévation console, `RoleSwitcherBar:111-141`,
  `Navbar:310,538`, `ClientPortal:353`), auto-`admin_general` sur email
  (`BOOTSTRAPPED_ADMIN_EMAILS:109-114` + `syncFirestoreProfile:179-207`),
  OTP client `Math.random()` affiché en clair (`ClientAuthModal:188-192`).
- Tokens : HMAC stateless 8h en `localStorage`, `verifySessionToken` ne consulte
  jamais `db.sessions` → logout ineffectif ; `timingSafeEqual` sans check longueur
  → 500 possible. PBKDF2 10k itérations (faible), même salt+hash pour 6 comptes
  bootstrap (`db.ts:94-99`). Rate-limit mémoire/IP seule, pas de `trust proxy`.
- Absents : vérification email exigée, MFA, lockout par compte, refresh rotation,
  invitation, `service_role` (bien absent du frontend).

## 9. RBAC & Permissions

- 18 valeurs `UserRole` avec doublons (`admin`/`admin_general`/`SUPER_ADMIN`/
  `super_admin` + 7 rôles techniques hors enum Firestore). Cible officielle 9 codes :
  écrits dans seeds 003 mais **non déployés**.
- Enforcement : 100 % frontend (`hasPermission`, `isAdmin*`, `App.tsx:120-131`).
  `RolesAndUsersManager` = CRUD `localStorage` + audit IP fixe `192.168.1.50`.
  `EnterpriseErpView:186` compare des emails en dur.
- Base : `has_permission()/is_super_admin()` + triggers anti-escalade écrits (002),
  non actifs distant. Écart : tout le RBAC serveur reste à brancher (chantiers 3-5).

## 10. Supabase

- Client `src/services/supabase.ts` : **FONCTIONNEL** (null + warn sans env, sinon
  `persistSession/autoRefreshToken/storageKey viva_supabase_auth`).
- Env : `.env.local` passé de `NEXT_PUBLIC_*` à `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` (présentes au dernier check) ; `.env.example` documente.
  Connexion testée OK (`connected:true`, valeurs jamais affichées).
- Migrations locales 001→007 présentes et saines (0 motif destructif, 12
  `ON CONFLICT` en 003, 48 policies). **Distant : NON appliquées** (base vide,
  `PGRST205`, buckets `""`). Statut : LOCAL oui / REMOTE non / à appliquer 001→007
  dans l'ordre via SQL Editor ou `db push` (impossible en anon).

## 11. PostgreSQL

Schéma local : 4 tables RBAC + 21 tables métier (CMS+versions, menus hiérarchiques,
modules + `module_permissions` normalisée, forms/fields/submissions, media/youtube×2,
`org_units` auto-FK, clients/projects/quotes/items, erp_tasks/transactions/
cash_closures, audit append-only, `app_settings`). UUID PG, CHECK, UNIQUE, index,
triggers `updated_at`/immutabilité. Champs dérivés des types réels
(`CmsSectionItem`, `DynamicMenu/Module/Form`, `OrganizationUnit`, `CrmClient`,
`AccountingTransaction`, etc.). Rien déployé distant.

## 12. RLS

Écrites (002 + 005), non actives distant. Design : deny-by-default, `has_permission()`
réutilisé, public restreint (`cms published`, `menus actifs public`, `media
published/public`, `org actifs`, `youtube`), owner (`submitted_by/owner/lead/
assigned = auth.uid()`), inserts publics volontaires (`quotes`, `form_submissions`,
`audit`) avec spam à filtrer Edge. Points durs identifiés : `youtube_config USING
(true)` (singleton non sensible, acceptable), `submissions/quotes/audit INSERT`
ouverts (rate-limit à ajouter), `projects` sans lecture anon (voulu).

## 13. Storage

Buckets prévus `media, cms` (publics) + `quotes, erp, signatures` (privés), 7 policies
RBAC (006). Actuel Firebase : écriture tout-signé jusqu'à 50 Mo, `contentType`
spoofable, fallback URL forgée = faux succès (`storageService.ts:44-55`),
suppression doc Firestore sans suppression fichier (`deleteMediaItem`). Validation
MIME/extension/taille/ownership anti-exécutables à faire côté Edge + policies.

## 14. Sécurité

- 🔴 Bypass auth/élévation (cf. §8) ; `/api/sync/push` sans autorisation, `...data`
  brut → défacement/fraude comptable ; XSS stockée (CMS/menus sans sanitize) sans CSP.
- 🔴 Secrets : `.env` avec `SESSION_SECRET`+`ADMIN_PASSWORD` réels livré dans le
  dossier, `firebase-applet-config.json` commité, `data/viva_database*.json`
  (hashes/salts) versionnés, PII démo (`visitorTrackingService`, Rawbank/gouvernorat).
- 🟠 Firestore : `audit_logs create` sans auth (forgery), `erp_tasks` lisibles tout
  signé, `isBootstrappedAdmin` sans `email_verified`, quotes/form publics sans
  CAPTCHA/quotas ; `logAuditEvent` champs libres.
- 🟠 Headers : pas de CSP/HSTS/`Permissions-Policy`, CORS non configuré, CSRF
  non applicable (Bearer localStorage, volable par XSS).
- 🟡 `verifySessionToken`/`verifyPassword` : crash longueur, 10k itérations ;
  `GET /api/health` leak `godMode:"active"`.

## 15. API

Express : 1 endpoint critique (`sync/push`), validation absente, limite 10 Mo,
erreurs JSON avec messages internes possibles. Pas d'Edge Functions, pas de RPC.
Recommandation : figer Express en lecture legacy, nouvelles écritures via Supabase
+ RPC/Edge (`quotes.submit`, `erp.validate`, `admin.*`).

## 16. Gemini / IA

`@google/genai@2.4.0` installé, **0 appel** dans le code. Seules mentions :
`architectureDocs.ts:90` (fichier `geminiAiService.ts` inexistant) et onglet
Super Admin `gemini-ai` (panneau d'avertissement, pas d'opérationnel). `README`
demande `GEMINI_API_KEY` dans `.env.local` (absente, bien). Cible : Edge Function
`gemini-ask` (clé serveur, contexte `auth.uid()`→permissions, plan proposé →
confirmation humaine → mutation RLS → audit). Risque actuel : aucun (inexistant),
risque futur : clé frontend (interdit).

## 17. CMS

🟡 PARTIEL — Modèle draft/published/archived + versions + preview fonctionnels
(`ProjectDataContext:727-843`), 14 sections initiales, persistance Firestore
directe sans sanitize, `resetToDefaults` destructif. Compatible schéma 004
(`cms_sections` + `cms_versions`). Manque : RLS active, historique serveur, auteurs
`profiles`, rollback contrôlé.

## 18. Platform Builder

- Module Builder 🟡 : CRUD + flags, persistance Firestore directe, `allowedRoles`
  texte libre (normalisé en `module_permissions` côté PG).
- Menu Builder 🟡 : hiérarchie/ordre/visibilité OK, `minRole` incompatible avec
  enum users (normalisé `visibility` + `required_permission` côté PG).
- Form Builder 🟡 : 16 types de champs, soumissions anonymes possibles, pas de
  quotas/validation serveur.
- Workflow Builder ⚪ ABSENT (statuts ad hoc par entité, pas de moteur).
- Organization Builder 🟡 : 9 directions + unités dynamiques, IDs fragiles.
- Feature Flags 🟡 : `localStorage` + `app_settings` PG prévu, pas de ciblage.
- Executive Board ⚪ ABSENT (pas de table, à modéliser si besoin).

## 19. Organisation

9 directions + 4 sous-directions conformes vision dans `cmsAndErpDefaults.ts:12-174`
et `server/db.ts:239-402`, affichées (`DepartmentsCatalog`, `OrganizationalStructureManager`).
Écarts : doublons `DirectionOrg` (number id) vs `OrganizationUnit` (string id),
IDs `sub-1-1`/`unit-dg` manuels, `associatedUsers` emails en dur. Base : seeds
DIR-01→09 prêts (007), hiérarchie `parent_id` générique.

## 20. CRM

🟡 PARTIEL — `CrmClient`/`CrmInteraction` complets en types, CRUD local+Fires
...[truncated 9113 chars]