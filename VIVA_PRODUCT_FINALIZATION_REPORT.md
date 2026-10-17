# VIVA PRODUCT FINALIZATION REPORT (Prompt 2/2)
> Dernier sprint fonctionnel — produit GELÉ après ce rapport. 0 migration,
> 0 suppression legacy, 0 donnée inventée. `tsc` PASS, `build` PASS.

## 1-2. Résumé / État global
Back-office métier finalisé en mode produit : dossier projet 360°, Kanban,
affectations matériel, achats (workflow complet en session), devis dupliqués,
comptes réels calculés, clôtures en workflow, notifications unifiées, recherche
globale périmétrée, Gemini par profils, risques documentés, offline clarifié.
Tous les flux critiques exigent confirmation serveur avant succès.

## 3-8. Projets / Événementiel / Tâches / Planning / Équipes / Équipements
- `ProjectDetailDrawer` : brief, timeline jalons (CRUD + statuts), tâches liées
  réelles, équipe (noms/fonctions), livrables, devis liés, duplication,
  archivage, priorité — via `updateProjectDetails` (cœur PG + miroir).
- `ProjectManager` : recherche, filtre archivés, boutons Dossier/Dupliquer,
  erreurs explicites.
- Kanban 4 colonnes + déplacements confirmés + compteurs + vides.
- Équipements : recherche/filtres/stock existants + affectation projet
  (session, R4-08, sans décrément auto).

## 9-11. Logistique / Fournisseurs / Achats
- Logistique : modélisée (R4-10), pas de module dédié (données absentes).
- Fournisseurs : `PartnerEcosystem` existant conservé (fiches, statuts).
- `PurchasesModule` (onglet ERP, RBAC `purchases`) : lignes, montants saisis,
  workflow draft→closed, validateur horodaté, session + R4-12/13.

## 12-13. Devis / ERP
- Devis : duplication (nouvelle référence), proforma conservé, statuts
  confirmés, erreurs affichées. TVA : non introduite (montants HT, R4-15).
- Transactions : insert PG + trigger 011 ; transitions SANS policy UPDATE
  (verrou volontaire → RPC Phase DB) ; contrepassation liée ; OTP DAF
  toujours simulé (affiché comme tel — R4-17).

## 14-17. OHADA / Finance / Trésorerie / Clôtures
- Comptes codés en dur SUPPRIMÉS → mouvements nets calculés (validées seules)
  + plan comptable dérivé des écritures + mentions R4-19/22, vides explicites.
- ErpDashboard : sommes réelles (à vérifier visuellement : totaux issus des
  transactions, TVA non appliquée).
- Clôtures : stepper OPEN→CLOSED affiché, écarts/justifications réels,
  immutabilité rappelée (R4-23).

## 18-21. Workflows / Notifications / Gemini / Offline
- Workflows liés aux formulaires (session) ; presets par module à brancher
  sur R2-02.
- `NotificationCenter` (audit refus + journal domaine de session, canaux
  externes marqués non connectés) + cloche Navbar + émetteurs contextes.
- Gemini : profils par rôle (staff complet / client / visiteur informatifs),
  actions config réservées staff, simulations marquées.
- Offline : statuts + file affichés, conflits documentés last-write-wins
  transitoire (R4-28/30) ; `sync/push` toujours ouvert (bloqueur).

## 22-26. Audit / Sécurité / RBAC / Dashboards / Global Search
- Audit : centres Admin lisent le réel ; trigger 010 déployé pour l'acteur.
- SecurityCenter : table des 9 risques (statuts KNOWN/MITIGATED/PENDING).
- RBAC : nouvel onglet `purchases` + permissions ; gardes UX, RLS = frontière.
- Dashboards : réels uniquement (SuperAdmin, ERP, client) ; DG/DAF/Chef/
  Commercial sans dashboard dédié (R2 : à créer si besoin confirmé).
- `GlobalSearch` périmétrée par rôle + cloche, Navbar (membres seuls).

## 27-28. États / Responsive
Vides/erreurs/loading partout ajoutés ; offline/sync/permission couverts ;
design system conservé ; responsive existant inchangé.

## 29. DATA REQUIREMENTS
R4-01→R4-35 complets (objectif/entités/champs/relations/contraintes/index/
permissions/RLS/audit/Storage/workflow/dépendances/risques/source/futur).

## 30-32. Legacy / Mock / localStorage-IndexedDB / Firebase / Express
Conservés et cartographiés (§30 du gel : KEEP = contexts miroirs, cents
pilotage ; MIGRATE = tout le métier ; REPLACE = faux succès restants
[tickets, votes, OTP] ; REMOVE LATER = `.env` secrets, `INITIAL_*` après
seeds, Express après cutover ; DB REQUIREMENT = R2/R3/R4).

## 33-37. MIGRER / REMPLACER / SUPPRIMER / DB / Risques
Voir §30 + matrices. Critiques restants : secrets, `sync/push`, XSS/CSP,
RPC financier, PII démo, rate-limit, backups.

## 38-43. Tests / tsc / build / checklist / RECOMMANDATION DB
Parcours A-G : structurellement couverts (tests manuels à exécuter :
isolation A↔B rejouée, TEST A-L Wave 1 en attente). `tsc` PASS. `build`
PASS. Checklist production §31 : AUTH partiel, RLS distante OK, Storage
partiel, BACKUP/PITR non configurés, SECRETS ouverts, RATE-LIMIT/CSP absents,
TESTS/CI absents.
RECOMMANDATION : UNE SEULE base définitive construite d'après R2+R3+R4 +
produit gelé — séquencer : schéma → RLS → Storage → RPC → seeds institutionnels
→ migration données (miroirs comme source) → cutover lectures → décommission.

## GEL
Produit fonctionnel GELÉ. Prochaine étape : "VIVA DEFINITIVE DATABASE
ARCHITECTURE". Aucun développement fonctionnel au-delà de ce rapport.
