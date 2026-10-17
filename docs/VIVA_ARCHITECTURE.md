# Architecture VIVA EVENT SOLUTIONS

> Phase 1 — fondations. Référence : `VIVA_PRODUCTION_AUDIT.md` (Phase 0).
> Règle mère : **SUPABASE = UNIQUE SOURCE DE VÉRITÉ** (RULE-001).

## 1. Principes

1. Le code est un moteur ; les données + la configuration déterminent le
   comportement (CMS, menus, modules, formulaires, organisation, flags).
2. Aucune décision de sécurité ne vient du navigateur (RULE-006/007).
3. Pas de seconde source de vérité métier : chaque donnée a UN propriétaire
   (PostgreSQL), les autres couches sont cache/legacy en migration.
4. Migration lente et vérifiée > réécriture rapide. Firebase/Express coexistent
   comme legacy jusqu'au cutover validé.

## 2. Frontend

React 19 + Vite 6 + Tailwind 4, `src/` actuel conservé. Routage par état local
(`App.tsx`) — un vrai routeur viendra en Phase 4 si besoin. Couche d'accès :
UI → service métier (`src/services/*`) → Supabase. Interdiction d'appels
`firebase/*` dans tout nouveau code ; interdiction de logique d'autorisation
dans les composants (masquage seul).

## 3. Authentification

Cible Phase 2 : Supabase Auth unique (`signInWithPassword`, `signUp`, `signOut`,
`getSession`, `onAuthStateChange`), session persistée native (`viva_supabase_auth`),
profil `profiles.id = auth.uid()` → `roles.code`. Supprimés à terme :
`loginAsClient`, `setUserRole`, fallback Express HMAC, auto-admin par email.
Actuel (legacy) : Firebase Auth + Express — documentés, non étendus.

## 4. Autorisation

`auth.uid()` → `profiles.role_id` → `role_permissions` → `has_permission(code)`.
Helpers `SECURITY DEFINER` (`current_role_id/code`, `has_permission`,
`is_super_admin`) + trigger anti-escalade sur `profiles`. Le frontend lit les
permissions pour l'UX uniquement.

## 5. PostgreSQL

Schéma : socle RBAC (`roles`, `permissions`, `role_permissions`, `profiles`) +
métier 004 (`cms_sections/versions`, `menus`, `modules(+module_permissions)`,
`forms/fields/submissions`, `media_items`, `youtube_config/videos`, `org_units`,
`clients`, `projects`, `quotes/items`, `erp_tasks/transactions`, `cash_closures`,
`audit_logs`, `app_settings`). UUID `gen_random_uuid()`, FK, CHECK, index,
triggers `updated_at`. Migrations `supabase/migrations/001→007`, idempotentes,
ordre strict. Statut : locales OK, distantes à déployer (base vide vérifiée).

## 6. RLS

`ENABLE ROW LEVEL SECURITY` partout, deny-by-default. Public restreint
(CMS publié, menus actifs publics, médias publiés/publics, org active, YouTube),
owner (`submitted_by/owner/lead/assigned = auth.uid()`), staff par permission,
écritures sensibles via RPC/Edge. Immutabilité `erp_transactions(valide)` et
`audit_logs` par triggers.

## 7. Storage

Buckets `media, cms` (publics) + `quotes, erp, signatures` (privés), policies
006 alignées RBAC (`media.upload`, `quotes.create`, `erp.create`). Métadonnées en
`media_items` (`storage_path`, visibilité, statut). Règles : jamais d'upload
ouvert, validation type/taille côté Edge, suppression fichier + ligne couplées,
jamais de faux succès.

## 8. Edge Functions

Réservées aux opérations privilégiées : attribution rôles, validation financière
(double-signature), purge Storage, Gemini (`gemini-ask`), rate-limit/anti-spam
des inserts publics. Seules détentrices de `service_role` (jamais frontend).

## 9. Audit

`audit_logs` append-only (trigger anti update/delete). Acteur = `auth.uid()`
côté serveur, timestamp serveur, `metadata JSONB`. Écritures clientes directes
actuelles (Firestore/localStorage) à remplacer par inserts RLS + Edge.

## 10. Offline

```
ONLINE  → Supabase (lecture/écriture)
OFFLINE → IndexedDB (cache + queue `syncService`/`offlineDb`)
RECONNEXION → flush contrôlé → résolution serveur gagne → audit
```
`last-write-wins` actuel = temporaire, documenté comme tel.

## 11. Synchronisation

Queue actuelle conservée comme mécanisme, rebranchée sur upsert Supabase
(`updated_at`, `ON CONFLICT`), résultats par item (pas de `clear()` global),
retry avec backoff. Conflits métier (devis, transactions) : rejet + revue humaine.

## 12. Gemini

Voir `docs/GEMINI_ARCHITECTURE.md`. Non développé en Phase 1.

## 13. CMS

`cms_sections` (draft/published/archived + champs `published_*`) + `cms_versions`.
Workflow draft→publish→archive, auteurs `profiles`, XSS traitée côté rendu
(sanitize) + Edge.

## 14. Platform Builder

`menus` (hiérarchique, `visibility`, `required_permission`), `modules`
(+`module_permissions` normalisée), `forms/fields/submissions`,
`org_units` (auto-FK), `app_settings` (flags/branding/finance). Workflow Builder
et Executive Board : ABSENTS, tables à prévoir (`workflows`, `executive_board`).

## 15. CRM

`clients` (+`owner_profile_id`) ; contacts/prospects suivis dans `clients`
(catégorie/statut) en attendant une table `contacts` dédiée si le besoin est
confirmé en Phase 5.

## 16. ERP

`erp_tasks`, `erp_transactions` (double-signature : `en_attente_manager` →
`en_attente_otp_daf` → `valide`, immuable puis contrepassation),
`cash_closures` (unicité date+devise). Logique validée côté RPC, jamais client.

## 17. Client Portal

Lecture `quotes/projects/form_submissions/media` filtrée owner (`submitted_by =
auth.uid()`), jamais de listing croisé (IDOR couvert par RLS).

## 18. Public Website

Lecture anon restreinte aux policies `*_public_read` (CMS publié, menus actifs,
médias publiés, org active, YouTube). Soumissions publiques : `quotes`,
`form_submissions` (insert anon + anti-spam Edge ultérieur).

## 19. Legacy

Voir `docs/LEGACY_MIGRATION.md`. Firebase/Express/JSON = lecture/écriture
runtime actuelle, gel des nouvelles fonctionnalités, retrait après cutover.

## 20. Stratégie de migration

Phases 2→9 du plan (Auth+RBAC → Supabase Core → Platform → ERP/CRM → Public/Client
→ Gemini → Offline/Audit → QA/Prod). Chaque phase : analyser → modifier →
`tsc`+`build` → vérifier → continuer. Aucune migration destructive, aucun reset.
