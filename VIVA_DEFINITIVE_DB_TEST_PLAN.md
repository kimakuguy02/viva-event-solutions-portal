# VIVA DEFINITIVE DB — PLAN DE TESTS
> Tests SQL/RLS exécutables post-déploiement. Convention : comptes jetables
> `*-test.cd` (Auto Confirm), nettoyage systématique après chaque campagne.
> Statuts : à exécuter (jamais simulés).

## T1 — RLS par rôle (matrice §6 validation)
Pour chaque table owner-scopée × rôle (anon, CLIENT, staff du périmètre,
hors périmètre, SUPER_ADMIN) : `SELECT` (lignes attendues), `INSERT`
(valide/refusé), `UPDATE` (own/cross), `DELETE` (toujours refusé sauf policy).
Outil : sessions JWT réelles via API (jamais SQL owner, qui bypass RLS).

## T2 — Isolation CLIENT A↔B (OBLIGATOIRE, déjà prouvé sur devis — à rejouer)
Scénario : 2 comptes + 2 lignes par table (`quotes`, `projects`, `tickets`,
`requests`, `notifications`, `documents`, `contacts`, `interactions`).
Attendu : chacun voit/modifie les siennes (SELECT/UPDATE = 1 ligne),
cross-read = 0 ligne, cross-write = 0 ligne, cross-delete = erreur.

## T3 — Anti-escalade (OBLIGATOIRE, déjà prouvé — à rejouer)
`UPDATE profiles SET role_id=<SUPER_ADMIN> WHERE id=<soi>` → erreur trigger ;
`INSERT roles/permissions/role_permissions` → erreur RLS/policy ;
création `profiles` directe → erreur ; `user_permissions` (si créée) idem.

## T4 — Intégrité financière
- Insert `valide` sans `erp.validate` → forcé `en_attente_manager` (011).
- `UPDATE` ligne `valide` → erreur trigger ; `DELETE` → erreur.
- `erp_validate(tx)` : double-signature (initiateur≠manager≠DAF), OTP serveur.
- `erp_reverse` : contre-écriture liée, totaux nets inchangés.
- Partie double : `SUM(debit)=SUM(credit)` par transaction (contrainte).
- TVA : aucune ligne auto (test négatif : vérifier l'absence).

## T5 — Concurrence & idempotence
- Double `INSERT` même `operationId` → 1 ligne (`ON CONFLICT DO NOTHING`).
- Références : 2 créations simultanées → 2 références distinctes (RPC).
- `updated_at` optimiste contenus : écriture sur version périmée → conflit signalé.

## T6 — Offline/reprise
- Queue → flush → convergence (0 pending, relecture égale) ; coupure mid-flush
  → retry sans doublon ; conflit serveur-gagne documenté par entité.

## T7 — Triggers & fonctions
- Signup → profil CLIENT ; acteur audit = JWT ; `created_at` serveur ;
  `author` interactions = JWT ; `requester` achats = JWT.
- `EXECUTE` : helpers lisibles par `authenticated`, jamais `anon` sauf besoin
  prouvé ; `search_path` verrouillé (revue `proconfig`/`prosecdef`).

## T8 — Storage
- Buckets présents + flags public corrects ; upload anon refusé partout ;
  upload autorisé par rôle/bucket ; lecture privée croisée refusée ;
  signed URLs expirées refusées ; delete ligne + objet couplés.

## T9 — Non-régression applicative
- `tsc` + `build` verts ; parcours A→G (Prompt 2) manuels ; 0 faux succès ;
  overlays supprimés sans perte ; `resetToDefaults` retiré ; secrets hors repo.

## Automatisables (recommandé, phase DB)
T1 (matrice), T2, T3, T4 (partie double, immutabilité), T5 (idempotence) via
harness SQL+API avec rôles jetables. Manuels : T6 (réseau), T8 (URLs signées),
T9 (parcours), revue OHADA métier, revue PII.
## Nécessitant accès distant ou décision métier
Contenu `auth.users`, PITR, rate-limit/CSP effectifs, plan comptable officiel
final, seuils financiers, canaux de notification branchés, staging.
