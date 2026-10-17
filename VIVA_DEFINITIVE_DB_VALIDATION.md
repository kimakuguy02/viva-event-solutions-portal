# VIVA DEFINITIVE DB — VALIDATION TECHNIQUE
> Read-only. Aucune migration, aucun SQL exécuté, rien modifié.
> Légende : [V] vérifié distant · [L] connu local uniquement · [?] inconnu.

## 1. Fondations existantes — état de preuve

| Objet | Statut | Preuve |
|---|---|---|
| 25 tables présentes | [V] | lectures API ciblées + PGRST205 initiaux résolus |
| RLS active + enforcement | [V] | TEST 2/3 réels (isolation A↔B, refus escalade, 42501 anon) |
| GRANT 008 effectifs | [V] | passage 42501-généralisé → lectures ciblées OK après 008 |
| Seeds 003/007 | [V] | 9 rôles, ~52 perms, DIR-01→09, 4 settings lus |
| Buckets 006 (5) | [V] | `listBuckets` + policies lues |
| Triggers 002/005/010/011 (comportement) | [V] | signup→CLIENT, refus escalade, insert `valide` forcé, acteur forcé |
| Colonnes/contraintes exactes distantes | [L] | définies par migrations, jamais introspectées (`\d`, `pg_constraint` non lus) |
| Texte exact policies/triggers/fonctions distants | [L] | comportement prouvé, code non relu distant |
| `auth.users`, PITR/backups, rate-limit, logs | [?] | accès insuffisants — ne pas supposer |

## 2. Décisions verrouillées

- D-01 Rôles : 9 canoniques, pas de doublons ; custom via `roles.is_custom` + Edge.
- D-02 Permissions : matrice `role_permissions` + `*.manage` staff pour le croisé ;
  `*.view` = UX uniquement. `user_permissions` : **NON créée** (complexité inutile ;
  retirer des specs si encore mentionnée).
- D-03 Organisation : `org_units` + `org_memberships` + `org_unit_modules` ;
  directions 01→09 intangibles (seed système).
- D-04 Propriétaires : toute ligne owner-scopée porte `owner_profile_id NOT NULL` ;
  orphelins → quarantaine `__unowned__` + revue humaine (jamais d'attribution auto).
- D-05 Références : `reference/code/piece_reference` UNIQUE, non séquentielles
  (RPC `reference_mint`) ; UUID techniques jamais exposés comme référence.
- D-06 CRM : `contacts` table dédiée (multi-contacts exigé) ; interactions avec
  auteur forcé serveur ; prospects = `clients` (catégorie/statut), pas de table.
- D-07 Demandes/tickets/documents : tables dédiées, `owner NOT NULL`, pièces en
  Storage privé + signed URLs courtes ; tickets : insert public + CAPTCHA/rate-limit Edge.
- D-08 Projets : membres/jalons/livrables en tables (pas de JSONB) ; `team TEXT[]`
  legacy migré vers `project_members` puis colonne retirée.
- D-09 Achats/fournisseurs/stocks/maintenance : tables dédiées ; quantités
  calculées (`qty_available` = vue, pas de colonne saisie).
- D-10 OHADA : plan officiel seedé, `journal_entries` + contrainte partie double
  serveur, journaux explicites ; **zéro TVA automatique** (taxes = lignes
  explicites opt-in).
- D-11 Workflows : tables + moteur générique + liens ; presets par module ;
  exécution = transitions auditées, jamais d'écriture directe cross-étapes.
- D-12 Notifications : écriture serveur/Edge uniquement ; préférences opt-in in-app ;
  canaux externes déconnectés jusqu'au branchement (jamais de faux envoi).
- D-13 Audit : `before/after` ajoutés, append-only absolu, acteur forcé ;
  `security_events` séparé de l'audit métier.
- D-14 Sync : contrat `sync_operations` + `operationId` UNIQUE + serveur-gagne
  documenté par entité + journal de conflits ; localStorage/IndexedDB hors vérité.
- D-15 Gemini : `ai_actions` + Edge + confirmation + périmètres ; prompts sans PII.

## 3. Décisions ouvertes (risque + recommandation)
- O-01 `menus.manage` mono-rôle → **recommandé** : étendre à DG/ADMIN_RH/DAF en
  lecture seule via nouvelle perm `menus.view_all` (risque : sur-attribution sinon).
- O-02 `modules_public_read` large → **recommandé** : ajouter `is_public` et
  restreindre (risque : exposition de modules internes, faible).
- O-03 Soldes d'ouverture : source ? → **recommandé** : saisie DAF unique avec
  double validation + audit (risque : soldes inventés sinon).
- O-04 Staging : aucun environnement → **recommandé** : projet Supabase staging
  avant prod (risque : tests sur prod).
- O-05 `user_permissions` : trancher définitivement (recommandation D-02 : non).

## 4. Invariants métier — couverture
| Invariant | Mécanisme | État |
|---|---|---|
| Pas d'escalade client | trigger + RLS + RPC admin | [V] (testé) / RPC à créer |
| Pas de lecture/modif inter-clients | owner + `*.manage` (009) | [V] (testé devis) / généraliser |
| Pas de validation financière UI-seule | pas de policy UPDATE + RPC `erp_validate` | partiel (RPC à créer) |
| Immuabilité `valide` + contrepassation liée | triggers + `reversed_by` | [V] partiel / RPC à créer |
| Écritures équilibrées serveur | contrainte partie double | à créer |
| Zéro TVA auto | lignes explicites | verrouillé (revue à la DB) |
| Montants/devises/clôture serveur | CHECK + RPC | CHECK [V], RPC à créer |
| Audit sensible fiable | trigger 010 + append-only | [V] (à re-tester) |
| Sync idempotente + conflits | contrat + journal | à créer |
| Gemini confiné | Edge + périmètres + audit | à créer |

## 5. Incohérences détectées
- I-01 : `UserRole` 18 valeurs (doublons) vs 9 codes canoniques → mapping brûlé
  dans le code, à remplacer par lecture DB (vague applicative).
- I-02 : `menus.minRole`, `modules.allowedRoles` texte libre vs RBAC normalisé.
- I-03 : statuts TS multiples non alignés (`revue` vs IN_PROGRESS, `en_attente_acompte`,
  `ecart_justifie`) → normaliser par domaine à la DB.
- I-04 : `QuoteRequest.userId/clientId`, `AccountingTransaction.performedBy` (noms)
  vs FK uuid → résolution noms→ids à la migration (quarantaine si ambigu).
- I-05 : `youtube_config USING(true)` assumé acceptable (singleton vide) — revalider
  si contenu sensible ajouté.

## 6. Verdict : **PRÊT POUR MIGRATIONS** (sous conditions)
Conditions : staging créé (O-04), décisions O-01→O-03 tranchées, `user_permissions`
tranchée (O-05), accès SQL owner pour appliquer + vérifier. Bloquants actuels :
aucun sur la conception ; exécution en attente de validation humaine.
