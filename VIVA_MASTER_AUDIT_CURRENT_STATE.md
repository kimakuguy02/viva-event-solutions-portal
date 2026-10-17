# VIVA EVENT SOLUTIONS PORTAL — AUDIT MAÎTRE DE L'ÉTAT ACTUEL
> Phase d'audit uniquement. Aucun fichier de code modifié, aucune migration créée,
> aucune donnée touchée. Photographie au 05/10/2026. Réf : audits Phase 0/1,
> rapports Phase 2/3/4, validations de déploiement 001→009.

## 1. Executive Summary

Application **prototype avancé, non production-ready** : ~107 fichiers sources,
interface riche (vitrine, portail client, ERP, Super Admin 19 zones), build et
typecheck verts. Persistance réelle = **Firestore + localStorage + IndexedDB +
JSON Express** ; Supabase (25 tables, RLS, 9 rôles, 5 buckets, déployé et validé
001→009) n'est branché que sur **Auth + paramètres + 8 familles en double-écriture
transitoire** (writes Supabase-first + miroir legacy, reads avec overlay). Bypass
auth historiques supprimés du chemin actif (Phase 2). Restent ouverts : RPC
financier, cutover des lectures, purge des mocks/PII, secrets versionnés,
tests/CI absents.

## 2. Architecture actuelle

React 19 + Vite 6 + Tailwind 4, routage par état (`App.tsx`, ~20 onglets, route
secrète `#auth/admin-access`), 4 contexts (`Auth`, `ProjectData`,
`EnterpriseErp`, `Theme`), ~90 composants, 11 services Supabase Partiel +
`firebase.ts/apiClient/syncService/offlineDb/storageService`. Backends actifs :
Firestore (16 collections), Express JSON (`server/`), Supabase partiel (écritures
8 familles). Aucune séparation stricte UI/métier/données côté legacy.

## 3. Architecture cible recommandée

React → Supabase Auth → Profiles/Rôles → RLS → PostgreSQL (+RPC/Edge pour le
sensible) → Storage ; IndexedDB = queue/cache ; Gemini via Edge + confirmation
humaine. État : fondations posées (docs `VIVA_ARCHITECTURE`, rules 001-016),
migration strangler en cours par vagues, cutover + décommission Firebase/Express
en fin de parcours.

## 4. Cartographie des fonctionnalités

| Domaine | Statut | Preuve de persistance |
|---|---|---|
| Vitrine (accueil, pôles, partenaires, annonces, billetterie, votes, live) | 🟡 PARTIEL | Firestore + mocks (`INITIAL_*`, questions live en mémoire) |
| Devis public (3 formulaires) | 🟡 PARTIEL | Supabase-first + miroir (Wave 2) ; refs `DEV-VES` collision possible |
| Espace client (commandes, tickets, votes) | 🟡 PARTIEL | Commandes persistées (Wave 2) ; tickets/votes en mémoire |
| Auth (email, Google, reset, change) | 🟡 PARTIEL | Supabase-first + repli legacy ; profils PG |
| CMS/draft/publish/versions | 🟡 PARTIEL | Supabase-first (Wave 2) ; versions PG |
| Menus/modules/forms/org/médias/YouTube | 🟡 PARTIEL | Supabase-first + miroir (Wave 2) |
| Projets/devis (admin) | 🟡 PARTIEL | Supabase-first + miroir (Wave 2) |
| ERP transactions/double-signature | 🟠 À CORRIGER | Insert PG + trigger 011 ; validation = legacy (RPC Phase 5) |
| Clôtures caisse | 🟡 PARTIEL | Supabase-first (rôle `erp.validate` exigé) |
| Tâches/CRM | 🟡 PARTIEL | Supabase-first (UUID canoniques) |
| Users/rôles (admin) | 🔵 MOCK | `localStorage viva_managed_users` — jamais branché |
| Audit admin | 🔵 MOCK | `localStorage` + Firestore libre ; serveur après 010 |
| Thèmes/branding | 🟡 PARTIEL | localStorage (+ `branding.defaults` PG non branché) |
| Paramètres finance/features | 🟢 FONCTIONNEL | Supabase SSOT (Wave 1) |
| Reset database | 🟠 À CORRIGER | Neutralisé (armement + SUPER_ADMIN), portée locale affichée |
| Notifications/messagerie | 🔵 MOCK | État mémoire (`StaffMessagingModule`) |
| Gemini | ⚪ ABSENT | Dépendance seule, contrat documenté |

## 5. Cartographie des données

25 tables PG (4 RBAC + 21 métier) déployées ; `equipment/partners/departments/
crm_interactions/tickets/employés/prêts/maintenance/notices/live/workflows/
notifications/contacts/executive/ai_actions/user_permissions` : ⚪ ou legacy
(Firestore/`INITIAL_*`). Champs riches TS sans colonne PG (caption, breakdown
devis, milestones, noms d'acteurs) conservés via miroir — fidélité complète à
la migration des données.

## 6. Sources de vérité

Effectives : Firestore (runtime), JSON Express (backend), localStorage ~25 clés,
IndexedDB ×2, `INITIAL_*`, mémoire. Cible partielle : Supabase (auth, settings,
8 familles en double-écriture). Divergences connues : merges last-write-wins,
 overlays PG-gagne, `resetToDefaults` local. Aucune source supprimée (strangler).

## 7. Authentification

Supabase-first (`signIn/signUp/signOut/reset/updateUser`, session native,
trigger CLIENT, confirmation email). Repli legacy Firebase/Express marqué,
auto-désactivé au déploiement (déployé). Bypass supprimés : `loginAsClient`,
`setUserRole`, auto-admin, OTP simulé. Restes : OTP DAF simulé (Phase 5),
rate-limit mémoire Express, PBKDF2 10k + salt partagé (rotation à faire).

## 8. RBAC

9 codes canoniques, matrice en base, helpers + trigger anti-escalade validés en
réel (refus `Élévation refusée` prouvé). Enforcement : RLS distant + gardes UX
(`RequireRole`, flags). Trous : `UserRole` 18 valeurs avec doublons, emails
staff en dur (3 spots, chantiers 4-5), `roles.manage` alias legacy, menus
`minRole` approximés, validations ERP côté client (RPC à venir).

## 9. Sécurité

CRITIQUE résiduels : secrets versionnés (`.env`, hashes/salts JSON, clés
Firebase), `/api/sync/push` sans authz, XSS stockée sans CSP. HAUTE : quotes/
submissions/audit inserts publics (rate-limit Edge à faire), R3-1/R3-2 en cours
(trigger 010 déployé pour l'acteur), Storage Firebase ouvert, PII démo.
MOYENNE : `alert()`, `window.location.reload`, hash admin caché, IDs
prédictibles (`DEV-VES-999` collisions), `verifySessionToken` sans check
longueur. FAIBLE : 62 `console.*`, `godMode` dans `/health`.

## 10. Super Admin

19 zones : overview (compteurs React → vues SQL à faire), site-editor/pages
(CMS Wave 2 🟡), menus/modules/forms/orga/médias/YouTube (Wave 2 🟡),
users/roles (🔵 mock local), config/branding (settings Wave 1 🟢 + reliquats),
features (🟢), gemini (⚪ panneau), audit/security/firebase-state (🔵 local).
Chaîne cible imposée : session → permission → service → Supabase → relecture →
audit serveur → succès (appliquée Wave 1-2, à généraliser).

## 11. Client Portal

Inscription/connexion réelles (rôle CLIENT forcé DB), commandes persistées,
tickets/votes mémoire (non persistés). Isolation A↔B **prouvée en réel**
(devis + refus lecture/écriture croisées). Risque clos côté devis ; tickets/
messages à modéliser.

## 12. Site public

Riche et cohérent visuellement ; contenus Firestore + mocks ; exposition
YouTube/Unsplash externe ; SEO minimal (pas de SSR/sitemap), accessibilité non
auditée. Administrable partiellement (CMS Wave 2, pont `platform_config`
legacy pour hero/bienvenue).

## 13. CRM

Types complets, CRUD Supabase-first par `code` (Wave 2), interactions jamais
persistées distant (perte actuelle), table `crm_interactions`/`contacts`
manquante. Pipeline/fidélité : champs TS sans colonne (tiers, assignés).

## 14. Projets

CRUD Supabase-first par `code` + miroir (Wave 2). Rétroplanning/équipes/
jalons/livrables : mémoire ou absents. `departmentsAssigned` sans FK.

## 15. Devis

Soumission publique Supabase-first (3 points d'entrée async + erreurs
explicites), statuts admin, `quote_items` non exploité par l'UI (lignes
détaillées/options/remises en mémoire TS). Refs aléatoires 900 valeurs :
collision + énumération à durcir (séquence serveur).

## 16. ERP

Tâches (UUID canoniques) et transactions (insert PG + trigger 011) branchées ;
**validation/double-signature = legacy** (aucune policy UPDATE :
verrouillage volontaire en attendant le RPC — contournement impossible même
pour un admin, c'est le comportement sûr). Prêts/maintenance/rapports/notices :
mémoire ou IndexedDB, tables à créer ou modules à purger.

## 17. Finance

Clôtures Supabase-first (rôle `erp.validate` exigé — durcissement effectif),
calculs sur état fusionné, `theoretical` à base codée en dur (12000/18M),
comptes OHADA en labels texte. TVA/seuils en `app_settings` (Wave 1), taux ERP
figé constante (vague dédiée).

## 18. CMS

Sections/versions/draft-publish Supabase-first (appariement `content_key`),
champs `draft*` mappés sur copie de travail, `platform_config` hero en pont
legacy. Textes riches sans sanitize (XSS à traiter au rendu + Edge).

## 19. Forms

CRUD + soumissions Supabase-first (insert public RLS), champs remplacés en
bloc, `submissionsCount` non synchronisé, pièces jointes `file` sans Storage.

## 20. Workflows

⚪ ABSENT : aucun moteur (statuts ad hoc, pas d'étapes/responsables/délais/
notifications). Tables `workflows/*` à concevoir Phase 5-7.

## 21. Media

Métadonnées Supabase-first (appariement URL), config/ch
...[truncated 5836 chars]