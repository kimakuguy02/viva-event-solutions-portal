# VIVA PROMPT 1 — FRONT-OFFICE + CMS + CLIENT PORTAL + CRM

## 1. Résumé exécutif
Front-office finalisé en mode produit : CMS enrichi, SEO réel par page,
portail client isolé par ownership avec onglets profil/documents/notifications,
CRM (pipeline, contacts session, timeline unifiée labellisée). 0 migration,
0 donnée inventée, 0 faux succès ajouté, tsc/build verts, 0 régression 2.1/2.2.

## 2-7. CMS / Pages / Sections / Versioning / Publication / Media
- Duplication (brouillon), archivage/republication, filtres statut + page,
  statuts affichés par carte. `review` : non ajouté (CHECK PG à étendre — R2-11).
- Pages = regroupement par champ `page` existant (R2-12 pour table dédiée).
- Versioning/rollback/preview existants conservés (persistés Wave 2).
- Gallery : `mediaItems` réels + filtres existants ; albums : R2-17.
- Realizations : médias + projets réels, jamais de client/montant inventé.

## 8-11. Gallery / Realizations / YouTube / SEO
- YouTube : état « non configurée » explicite quand désactivée (plus de vide silencieux) ; sync API : non existante, affichée comme telle.
- SEO : `usePageMeta` réel (titre + description par onglet) ; métadonnées éditoriales en session (R2-20) avec mention « jamais injectées ».

## 12. Site public
Routes vérifiées une à une : aucune morte (toutes rendues par `App`, 404 sinon).
CTA devis branchés (`DepartmentsCatalog`, gateway cards). Cohérence conservée.

## 13-18. Client Portal (dashboard/profil/demandes/devis/projets/tickets/notifications)
- **Isolation corrigée** : devis filtrés e-mail exact, projets liés (projectCode/nom/org), transitionnel avant ownership serveur (R3-07/14).
- Profil : lecture seule + mention R3 (édition = persistance profils).
- Demandes = devis du client (référence, statut, montant si disponible).
- Devis : lecture + montants réels ; acceptation/refus : non simulés (absents → R3).
- Projets : timeline visuelle si dates existent (à compléter : avancement déjà affiché).
- Tickets : badge « session uniquement — R3-03 » (plus de fausse persistance).
- Notifications : actions propres de session uniquement + vides explicites (R3-04).
- Documents/médias : liens réels avec URL seulement + médias publiés liés au projet ; sinon vide explicite (R3-05/06).

## 19-24. CRM (prospects/clients/contacts/interactions/timeline)
- Pipeline 4 statuts (comptes + revenus réels, vides explicites), navigation vers fiche.
- Contacts : session liés au client, labsellisés R3-11, jamais inventés.
- Timeline unifiée : interactions + devis (e-mail) + projets (lien), sources labellisées, triée (R3-13 en base ensuite).
- Ownership affiché (`assignedManager`) ; `owner_profile_id` : R3-14.

## 25-26. Navigation / Auth-RBAC
Aucune route ajoutée/supprimée ; onglets client ajoutés (profil/documents/notifications) ; `RequireRole` inchangé ; isolation conceptuelle appliquée côté UI en attendant RLS R3 (tests A↔B à rejouer).

## 27-28. Responsive / Design
Composants existants réutilisés (rounded-3xl/border système), grilles responsive conservées, formulaires compacts, états vides partout, erreurs visibles. Aucune refonte.

## 29. DATA REQUIREMENTS
R2-11→R2-23 + R3-01→R3-15 ajoutés (`VIVA_DATA_REQUIREMENTS.md`, R2-09/10 restaurés après un remplacement accidentel — vérifié).

## 30-31. Temporaires / Legacy
Session : contacts CRM, métadonnées SEO/flags, hiérarchie menus, workflows. Mémoire : tickets, votes, live. Legacy intacts (Firestore/Express/JSON). Faux succès supprimés : OTP client (Ph.2), tickets (badgé), reset (P0).

## 32-33. Dette / Tests
`platformSession` sans persistance ; heuristiques de liaison (menus/modules, timeline) exactes via R2-09/R3-13 ; `security.*` sans modèle ; compteurs overview portail non filtrés par client (à affiner : utiliser myQuotes/myProjects).
Manuels : navigation complète, CRUD CMS/menus/forms, isolation visuelle A/B, JSON invalide, vides, responsive. À faire : tests A↔B distants rejoués + TEST A-L Wave 1 en attente.

## 34-35. TypeScript / Build
`tsc` PASS (0). `build` PASS. Régressions 2.1/2.2 : aucune (mêmes props, hubs intacts).

## 36. Régressions
Aucune détectée (build + tsc + portées locales). Point de vigilance : `myProjects` peut être vide pour clients historiques sans e-mail correspondant (vide explicite affiché — comportement voulu).

## 37. Préparation PROMPT 2
Base produit terminée côté front-office. Reste : back-office/ERP profond, workflows moteur, notifications serveur, Storage couplé, puis base définitive unique basée sur ce produit + requirements R2/R3.
