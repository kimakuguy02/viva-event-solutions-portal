# VIVA — AUDIT FINAL DE L'ÉTAT ACTUEL (07/10/2026)
> Audit uniquement : 0 modification, 0 migration, 0 suppression.
> Preuves du jour : `tsc` 0 erreur, `build` OK, distant relu en anon (tables A
> présentes, 25 historiques intacts, flags 6/7 visibles). Légende : ✅ PROUVÉ ·
> 🟡 PARTIEL · ❓ NON VÉRIFIABLE · 🔴 PROBLÈME.

## 1. Executive Summary
Produit : prototype avancé en migration strangler (117 fichiers sources,
17 migrations locales). Persistance réelle = Firestore + localStorage +
IndexedDB + JSON ; Supabase branché (auth, settings, 8 familles en double
écriture + vague A déployée non consommée par l'app). Bypass auth supprimés.
Bloqueurs restants : RPC financier, secrets versionnés, `sync/push` ouvert,
tests/CI, backups, PII démo. Verdict : NIVEAU 3 (détail §26).

## 2. Architecture actuelle
React 19 + Vite 6 + Tailwind 4, routage par état (~20 onglets + `#auth/admin-access`),
4 contexts, ~90 composants, 11+ services. Couche Supabase partielle
(`services/supabase/*` + overlay PG-gagne + miroir legacy). Séparation
UI/métier/données : partielle (contexts épais, managers avec logique inline).

## 3. Fonctionnalités (extraits — détail §4-8, §24)
| Domaine | Statut |
|---|---|
| Paramètres finance/features | ✅ persistés Supabase (Wave 1) |
| CMS/menus/modules/forms/orga/médias/YouTube/projets/devis | 🟡 Supabase-first + miroir |
| Tâches/clients ERP, transactions (insert), clôtures | 🟡 Supabase-first ; transitions = legacy (pas de policy UPDATE : verrou volontaire → RPC) |
| Users/rôles admin, audit admin, notifications serveur | 🟠 local/mémoire |
| Tickets/votes/live, OTP DAF, messagerie | 🟠 session/mémoire (badgés) |
| Gemini, workflows moteur, Edge/RPC | 🔴 absents (UX/maquettes seules) |

## 4. Super Admin
20 onglets : Dashboard réel (compteurs contextes + audit réel) ✅ ; CMS/menus/
modules/forms/orga/médias/YouTube 🟡 (Wave 2) ; users 🟠 (local) ; rôles/perms
🟡 (matrice + session) ; config/branding 🟡 ; features ✅ ; gemini 🟠 (maquette
sans clé) ; audit/security 🟡 (données réelles multi-sources) ; labo plateforme
🟡 (preview isolée, matrices lecture) ; firebase-state informatif. Persistance
après refresh : ✅ là où Supabase-first, 🟠 ailleurs. RLS : protège réellement
(PASS A↔B) ; RBAC serveur pour les familles migrées, frontend ailleurs.

## 5. Front Office
Accueil/pôles/partenaires/équipement/live/annonces/billetterie/votes/devis :
contenus Firestore + mocks (`INITIAL_*`, questions live mémoire). SEO : `usePageMeta`
réel (titre/description par onglet) ; sitemap/SSR absents. YouTube : état vide
explicite si désactivée. Sources : Firestore + mocks + mémoire ; Supabase : non.

## 6. Client Portal
Inscription/connexion réelles (rôle CLIENT forcé DB). **Isolation corrigée**
(filtre e-mail + liaison projectCode, transitionnel avant ownership serveur).
Profil lecture seule, documents à URL réelles uniquement, notifications =
actions propres de session (R3-04), tickets badgés session. A↔B prouvé côté
devis distant ; côté portail : filtrage UI (RLS R3 à rejouer).

## 7. CRM
Clients CRUD Supabase-first (par code) ; interactions jamais persistées distant
(perte actuelle) ; contacts session (R3-11) ; pipeline 4 statuts (données
réelles) ; timeline unifiée labellisée (interactions+devis+projets). Revenus :
champs TS affichés (agrégats non calculés serveur).

## 8. Projects
Dossier 360° (brief, jalons CRUD, tâches/devis liés réels, équipe, livrables,
duplication, archivage, priorité) via `updateProjectDetails` ; Kanban 4 colonnes ;
équipements : affectation session (R4-08). Jalons/équipe/livrables : miroir seul
(colonnes PG : R4-01).

## 9. ERP / Finance
Transactions : insert PG + trigger 011 (statut forcé) ; **aucune policy UPDATE :
transitions manager/DAF = legacy Firestore (choix sûr en attendant RPC)** ;
contrepassation liée ; OTP DAF simulé affiché comme tel. Clôtures :
Supabase-first (`erp.validate` exigé). Soldes codés en dur SUPPRIMÉS →
mouvements nets réels + plan comptable dérivé + mentions R4-19/22. Montants
`NUMERIC`, pas de TVA. Sécurité financière : **mixte** (insert serveur,
validation legacy) — RPC bloquant pour prod.

## 10. RBAC
9 codes canoniques en base ; `UserRole` 18 valeurs (doublons `admin`,
7 rôles techniques) ; `minRole`/`allowedRoles` texte libre ; emails staff en dur
(3 spots) ; `menus.manage` mono-rôle ; bypass `loginAsClient/setUserRole`
supprimés ✅ ; `isSuperAdmin` = DB seule ✅. Verdict : **mixte** (serveur/RLS
pour familles migrées, frontend ailleurs).

## 11. Supabase
- VERIFIÉ DISTANTEMENT : endpoint `bdldjeyrfbgpzxtelmbp`, 5 tables A lisibles,
  flags 6/7 visibles, 25 historiques intacts, buckets déjà validés, RLS/GRANT
  effectifs (comportement A↔B + 42501).
- CONNU LOCALEMENT : 17 migrations, services (requêtes Supabase-first +
  relecture + audit), Storage buckets 006 + `client_docs` (017, non vérifié
  contenu), 0 RPC, 0 Edge, Realtime non utilisé (overlays par fetch).
- NON VÉRIFIABLE : texte policies/triggers au-delà du comportement, `auth.users`,
  PITR/backups, `maintenanceMode` (masqué car `false` — cohérent).

## 12. Migrations (17 fichiers)
001→011 : réputées appliquées (preuves comportementales 001→009 + objets) ;
012→015 : appliquées (tables lisibles ce jour) ; 016→017 (vague B) et 010/011
: 010/011 appliquées (triggers prouvés fonctionnellement) ; 016/017 : locales
seules, NON appliquées (B en revue). Jamais supposer au-delà des preuves.

## 13. Sources de vérité (6 actives)
Supabase (partiel, croissant), Firestore (runtime), JSON Express (backend),
localStorage ~25 clés (SSOT de fait : users, audit local, préférences),
IndexedDB ×2 (ERP + queue), mémoire/`INITIAL_*`. Risque : divergences
last-write-wins documentées ; overlays PG-gagne en transition.

## 14. Persistance
✅ settings, CMS/menus/modules/forms/orga/médias/projets/devis (via Supabase
quand session+permissions, sinon refus explicite). 🟠 users/rôles, tickets,
votes, rapports/prêts/notices, jalons détaillés (miroir/session). Reload/
logout/login : ✅ familles migrées. Cross-session : ✅ Supabase-first.

## 15. Realtime
Aucun (overlays par fetch ; `onSnapshot` = Firestore legacy). Partielle.

## 16. Offline
IndexedDB cache + queue + statuts affichés + retry ; conflits last-write-wins
(documenté transitoire) ; `sync/push` Express ouvert (bloqueur) ; pas de
contrat `operationId` (R4-28). Principalement locale.

## 17. Sécurité
CRITIQUE : secrets versionnés (`.env`, hashes/salts JSON, clés Firebase),
`sync/push` sans authz, XSS stockée sans CSP. HAUTE : inserts publics sans
rate-limit, OTP simulé, PBKDF2 10k + salt partagé, PII démo, Storage Firebase
ouvert, faux succès résiduels badgés. MOYENNE : IDs prédictibles, `alert()`,
hash admin, 62 `console.*`. FAIBLE : `godMode` dans `/health`. Service_role :
absent du frontend ✅.

## 18. Gemini
Non appelé (0 appel, dépendance seule) ; contrat Edge + maquette à profils.
Pas de clé, pas d'action, pas d'audit IA. Conforme à l'état annoncé.

## 19. Storage
Firebase actif (trop ouvert) ; buckets Supabase 006 validés + `client_docs`
(017, non vérifié contenu) ; suppression couplée non implémentée ; faux succès
d'upload supprimé côté service (erreur propagée).

## 20. Audit
Trigger acteur (010) déployé ; `audit_logs` append-only + immutabilité prouvés
fonctionnellement ; writers admin encore locaux (8 spots) ; `before/after`
absent (R4-27) ; falsification possible hors chemins migrés.

## 21. Tests
0 automatisé, 0 CI. Preuves : campagnes manuelles documentées (TEST 2/3,
T-A, A↔B devis), `tsc`+`build` verts ce jour. Couverture réelle : faible.

## 22. Build
`tsc --noEmit` PASS (0 erreur) ; `npm run build` PASS ; 0 test à lancer
(aucun). Scripts : dev/build/start/preview/lint(=tsc). Pas de CI/CD.

## 23. Production Readiness (0-4)
ARCHITECTURE 2 · FONCTIONNALITÉS 2 · PERSISTANCE 2 · DB 2 · RLS 3 · RBAC 2 ·
AUTH 2 · SÉCURITÉ 1 · ERP 2 · FINANCE 1 · OFFLINE 1 · REALTIME 0 · GEMINI 0 ·
STORAGE 2 · AUDIT 2 · TESTS 0 · CI/CD 0 · BACKUP 0 · OBSERVABILITÉ 0 ·
PERFORMANCE 2 · SEO 1 · ACCESSIBILITÉ 1. Appréciation : les 1/0 (secrets,
sync ouvert, RPC, backups, tests) dominent la moyenne.

## 24. 10 bloqueurs
1. Secrets versionnés (`.env`, JSON, clés) — rotation+purge. 2. `sync/push`
sans authz — Edge `sync-push` + RLS. 3. XSS sans CSP/sanitize. 4. RPC financier
(`erp_validate/reverse`, OTP serveur, partie double). 5. PII démo + mocks en
prod. 6. Backups/PITR/staging non prouvés. 7. Rate-limit/anti-spam inserts
publics. 8. Tests/CI = 0. 9. Cutover lectures + décommission non faits
(6 SSOT). 10. OTP DAF + tickets/votes non persistants (ruptures fonctionnelles).

## 25. Terminé (réel, sans minimiser)
Auth Supabase-first + bypass supprimés ; settings SSOT ; 8 familles en
double-écriture validée partiellement ; RLS/GRANT/triggers prouvés (A↔B,
anti-escalade, immutabilité) ; vague A déployée ; portail isolé UI ;
soldes inventés supprimés ; faux succès OTP/tickets badgés ou supprimés ;
19 zones Super Admin + matrices + preview + builders fonctionnels ; docs
complètes (rapports + R2/R3/R4 + blueprints + tests).

## 26. Reste à faire
A (obligatoire) : §24.1-9. B (important) : cutover, RPC, Storage couplé,
notifications serveur, Gemini Edge, purge mocks/PII, CSP/headers, E2E A↔B
rejoués, observabilité, perfs bundle. C (futur) : workflows moteur,exec board,
contacts table, temps réel, staging, multi-env.

## 27. Verdict final : NIVEAU 3 — BÊTA AVANCÉE
Produit large et cohérent, fondations sécurité/DB réelles et partiellement
prouvées, mais 6 sources de vérité, RPC financier absent, secrets exposés,
0 test automatisé et backups non prouvés interdisent la production.
Divergences vs anciens rapports : aucune contredite par le code ce jour
(`security.*` documenté non implémenté — déjà noté ;
`user_permissions` encore mentionnée par endroits — trancher : abandonner).
