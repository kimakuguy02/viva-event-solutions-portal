# VIVA EVENT SOLUTIONS PORTAL
# PHASE 2 — AUTHENTIFICATION + RBAC + SÉCURITÉ

## 1. Objectif

Supabase Auth comme autorité d'identité, rôle depuis PostgreSQL, bypass
supprimés du chemin actif. Réf : audits Phase 0/1, RULE-001/003/006/007.

## 2. État initial

Firebase Auth + fallback Express HMAC, `loginAsClient` (sans passe),
`setUserRole` (élévation console), auto-`admin_general` par email,
OTP simulé affiché, token 8h en localStorage, logout ineffectif,
RBAC 100 % frontend. Distant Supabase : base vide (`PGRST205`) —
**REMOTE SCHEMA NOT DEPLOYED** (revérifié en début de phase).

## 3. Architecture d'authentification

Supabase-first avec repli legacy explicite (non privilégié) tant que le
distant n'est pas déployé : `getSession` + `onAuthStateChange` →
`profiles` → `roles.code` → `role_permissions`. Détection `PGRST205` →
`schemaMissingRef` → repli Firebase/Express existant (sans auto-admin).
Le repli se désactive seul dès que le schéma répond.

## 4. Supabase Auth

`signIn` (`signInWithPassword`), `signUp` (métadonnées prénom/tél/org ;
rôle CLIENT par trigger DB), `signOut`, `resetPasswordForEmail`,
`updateUser`, session native persistée (`viva_supabase_auth`), refresh auto.
Aucun mot de passe stocké, aucun token fabriqué, aucune `service_role`.

## 5. Profiles

`fetchSupabaseProfile` : `profiles + roles!inner` puis permissions via
`role_permissions`. Compte non-`active` → refus. `refreshProfile` exposé.
Legacy : lecture Firestore existante, nouveau profil = `client` minimum.

## 6. Roles

Codes canoniques 9 valeurs, mapping vers rôles legacy d'affichage
(`SUPER_ADMIN→admin`, autres directs). `roleCode` exposé pour les gardes
neuves. Aucun doublon créé, aucun rôle choisi par le client.

## 7. Permissions

Chargées depuis `role_permissions` (UX seule). `hasPermission` : SUPER_ADMIN
DB = tout ; sinon permission DB exacte (mode supabase) ; legacy = ancien
comportement conservé. Sécurité réelle = RLS/serveur.

## 8. RLS

Non déployée distant (base vide) — inchangée, à déployer 001→007 puis
tests ANON/CLIENT/STAFF/SUPER_ADMIN + anti-escalade réels (prérequis Phase 3).

## 9. Routes protégées

Nouveau `RequireRole` (rôles + permissions, état loading, refus explicite)
branché sur la route `super-admin`. Carte : `public/*` ouvert, `client/*`
(`quotes.view`/`forms.submit`), `admin/*` (staff), `super-admin/*`
(SUPER_ADMIN DB). UX seule — RLS reste la frontière.

## 10. Bypass supprimés

- `loginAsClient` : supprimé (3 usages rewired → `signIn`/`signUp` réels).
- `setUserRole` : supprimé (5 usages → `logout` ou affichage lecture seule).
- Auto-admin email : supprimé (legacy = `client` par défaut).
- OTP simulé : supprimé (confirmation email Supabase).
- Audit localStorage IP fixe dans les modals : supprimé.
- Restes classés C (chantiers 4-5) : emails staff dans `ProjectDataContext:435`,
  `EnterpriseErpContext:203` (gating subscriptions Firestore),
  `EnterpriseErpView:186` (gate d'affichage).

## 11. Firebase Legacy

Aucun nouveau flux. Restent : lecture session/profil (repli), Google popup
(repli), Storage, listeners Firestore (contextes non migrés). Plan retrait :
Phase 10 après cutover (`docs/LEGACY_MIGRATION.md` à jour).

## 12. Express Legacy

`ApiClient.login/getMe/logout` conservés pour le repli + `sync/push`
(à sécuriser Phase 8). Marqués LEGACY dans les toasts/logs.

## 13. Tokens

Supabase JWT géré par le SDK (jamais lu pour décider d'un rôle).
HMAC Express 8h conservé côté repli uniquement. Aucun secret ajouté ;
`service_role` absent du frontend (vérifié : 1 hit = commentaire).

## 14. Sécurité

Améliorations effectives : plus d'usurpation sans passe, plus d'élévation
console, inscription ≥ 8 caractères + confirmation email, anti-bruteforce
5 essais/5 min sur le modal, `isSuperAdmin` = DB seule. Non corrigés
(documentés SEC-*) : rotation secrets, CSP, PBKDF2, rate-limit global.

## 15. Tests

- `tsc --noEmit` : PASS. `build` : PASS (20s).
- Supabase réel : NON TESTABLE (base vide) — à faire au déploiement :
  signin/refresh/persist/signout, profil absent/suspendu, isolation
  CLIENT A↔B, `CLIENT→SUPER_ADMIN` refusé (trigger), `audit_logs` append-only.
- Régression UI : rôles legacy mappés, écrans staff/visiteur inchangés.
  Changement assumé : onglet super-admin inaccessible en legacy (plus
  d'auto-admin) jusqu'au déploiement + attribution SUPER_ADMIN.

## 16. Résultats

Checklist : AuthContext Supabase-first ✓, 0 nouveau flux Firebase ✓,
bypass supprimés ✓, rôles canoniques ✓, permissions DB ✓, logout réel ✓
(SDK + legacy), routes gardées ✓, secrets OK ✓, tsc/build ✓, 0 donnée
supprimée ✓, 0 nouvelle SSOT ✓.

## 17. Problèmes restants

Distant vide (bloque l'activation réelle), secrets versionnés, CSP/headers,
rate-limit, OTP DAF simulé (Phase 5), PII démo (Phase 9), `sync/push` ouvert.

## 18. Pré-requis Phase 3

Déployer 001→007, créer le premier SUPER_ADMIN via SQL/Edge (jamais via UI),
revérifier 3B réel, puis migrer `ProjectDataContext` (CMS/menus/modules/forms/
médias/orga) vers Supabase + Realtime.
