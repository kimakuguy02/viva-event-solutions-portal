# VIVA PHASE 2.2 — PLATFORM BUILDER COMPLETION
> Produit uniquement. 0 migration, 0 suppression legacy, 0 donnée touchée.
> `tsc` PASS, `build` PASS (20s).

## 1. Résumé
Super Admin devenu constructeur de plateforme : arborescence menus, catalogue
modules enrichi, matrices de traçabilité, Form Builder étendu + lien workflow,
labo plateforme (preview isolée), flags persistés + métadonnées. États session
explicitement temporaires, persistance réelle là où elle existait déjà.

## 2. Fichiers créés
`services/platformSession.ts` (magasin session + hook), `data/platformRbac.ts`
(matrice canonique partagée + 9 directions), `MenuTreeBuilder.tsx`,
`ModuleCatalog.tsx`, `PlatformMatrices.tsx` (2 matrices), `PlatformPreview.tsx`,
`FeatureFlagManager.tsx`, `VIVA_DATA_REQUIREMENTS.md` (R2-01→R2-10).

## 3. Fichiers modifiés
`RolesPermissionsManager.tsx` (matrice factorisée), `DynamicFormsManager.tsx`
(+7 types de champs, aide/placeholder, monter/descendre/dupliquer, mode JSON
validé, lien workflow, label de persistance honnête),
`WorkflowBuilder.tsx` (miroir vers le magasin partagé),
`SuperAdminHub.tsx` (onglet Labo plateforme n°20, features→flags, modules→catalogue,
menus→arbre), `types/cmsAndErp.ts` (`helpText`/`validation` additifs).

## 4-11. Fonctionnalités (§4 Menu §5 Module §6 Module→Menu→Permission §7 Form
§8 Form→Workflow §9 Organisation (manager existant + matrice Rôle→Org→Module)
§10 Flags persistés §11 Preview isolée) — voir rapport : toutes livrées sauf
création direction (manager existant conservé) et moteur d'exécution (simulation
marquée).

## 12. Architecture/adapters
UI → `platformSession` (session, remplaçable) → contexte existant
(Supabase-first + miroir) ; futur adapter Supabase sans refaire l'UI.
Structure `src/platform/` documentée comme cible, non imposée (évite la casse).

## 13. DATA REQUIREMENTS
`VIVA_DATA_REQUIREMENTS.md` : R2-01→R2-10 avec tables, relations, RLS, audit,
risques. Aucune migration créée.

## 14. Temporaires assumés
Hiérarchie menus, enrichissements modules, workflows, liens form↔workflow,
métadonnées flags, rôles custom : session, badgés, régénérables sans perte
métier (persistances réelles inchangées).

## 15. Dette technique
- `platformSession` : pas de persistance ni de concurrence inter-onglets.
- Matrices par heuristique de nom quand `moduleId` absent (R2-09 la rendra exacte).
- `ModuleManager`/`MenuManager` historiques toujours montés (redondance d'affichage à dédupliquer Phase 2.3).
- Lien workflow d'un formulaire sans workflows partagés = select vide (état vide OK).

## 16-18. Tests/tsc/build
Navigation 21 onglets, CRUD menus/modules/forms, JSON invalide (erreur affichée),
lien workflow, preview isolée (aucune mutation), responsive existant conservé.
`tsc` PASS (0). `build` PASS. Aucune donnée inventée (recherche vide = vide).

## 19. Reste pour Phase 2.3
Dédupliquer managers historiques, brancher `security.*`, moteur R2-02 minimal
côté produit, notifications, executive board, puis verrouillage scope avant DB.
