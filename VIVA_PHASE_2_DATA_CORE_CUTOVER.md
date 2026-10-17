# VIVA PHASE 2.2 — CUTOVER DES LECTURES
> État : lectures Supabase-first actives UNIQUEMENT là où tables vérifiées
> (settings, CMS, menus, modules, forms+submissions, org, médias, projets,
> devis, ERP-inserts, clients). Le reste lit le legacy (documenté §13-16).

| Domaine | Avant | Après | Legacy | Décommissionné |
|---|---|---|---|---|
| settings/flags | localStorage | Supabase SSOT | supprimé (clés retirées au chargement) | OUI |
| CMS/menus/modules/forms/orga/médias | Firestore+local | Supabase-first + overlay + miroir | Firestore (miroir+lecteurs) | NON |
| projets/devis | Firestore+local | Supabase-first + overlay + miroir | idem | NON |
| ERP inserts/closures/tasks/clients | Firestore/IDB | Supabase-first + miroir (+RPC 018 en attente) | idem | NON |
| transitions financières | Firestore (legacy effectif) | — (RPC 018 non déployée) | Firestore effectif, verrou RLS | NON |
| users/rôles admin | localStorage mock | lecture profiles fusionnée + bannière | écritures locales | NON |
| tickets/notifications/contacts | mémoire/session | inchangé (tables absentes) | — | NON |
| quotes/items riches, equipment, purchases | Firestore/mémoire/session | inchangé (tables absentes) | — | NON |

Règle appliquée : aucun legacy supprimé sans preuve de remplacement (preuves
ci-dessus par domaine). Realtime : non activé (contrats §15). Prochain jalon :
application 016→021 par le propriétaire, puis re-vérification et bascule.
