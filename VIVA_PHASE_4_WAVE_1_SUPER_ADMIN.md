# VIVA PHASE 4 — VAGUE 1 : SUPER_ADMIN → SUPABASE
> Plan seul. AUCUN fichier fonctionnel modifié. En attente d'autorisation.

## P0 — resetToDefaults : neutralisation proposée (non appliquée)

- Localisation : `src/context/ProjectDataContext.tsx:1070-1111` + bouton
  `PlatformSettingsManager` (onglet dangereux) et `ResetDatabaseModal.tsx:116`
  (`window.location.reload()` après reset).
- Destructions : 14 `setFirestoreDocument` (platform×2, departments, projects,
  quotes, equipment, partners, directions, org_units, menus, modules, forms,
  media, cms) + `Object.keys(localStorage).filter(viva_).removeItem` (:1102-1104)
  + `logAuditEvent` local. Aucune confirmation, aucun backup, atteignable par
  tout staff accédant aux paramètres.
- Proposition (à autoriser) : remplacer le handler par modale
  `type-to-confirm` + snapshot JSON téléchargeable + restriction `isSuperAdmin`
  (roleCode DB) + audit serveur ; interdiction de purge `viva_*` globale
  (vider uniquement les clés du domaine réinitialisé). Ne JAMAIS ajouter de
  TRUNCATE/DELETE massif côté Supabase.

## P1 — Audit actuel des 19 zones (constat, non corrigé)

- Writers : `logAuditEvent` Firestore (`firebase.ts:206-237`, champs
  `actorUid/userEmail/action` libres, `ipAddress: 'client-secure'` en dur) +
  8 writers `localStorage viva_audit_logs` (managers + ClientPortal, IP fixe
  `192.168.1.50`), lecture `AdminDashboard:49` + `RolesAndUsersManager:783`.
- Falsifiable : oui (tout champ forgeable, update/delete possibles en local et
  via `update/deleteDoc` Firestore — la règle `audit_logs` Firestore
  `update/delete: false` existe mais l'app ne l'exploite pas comme preuve).
- Ancien/nouvel état : partiel (versions CMS locales, rien d'autre).
- Cible vague 1 : `audit_logs` PG via RLS insert (`actor_user_id = auth.uid()`
  forcé par trigger Phase 8 / R3-1) ; lecture `audit.view`.

## P2 — Famille choisie : PARAMÈTRES (`app_settings`)

**Pourquoi elle** : 1 table, 0 relation, lecteurs connus, aucun flux financier
direct (le taux ERP restera constant pendant la vague → pas de régression
comptable), surface idéale pour roder service→RLS→audit→tests A-L.

### 1. Famille
Paramètres plateforme : finance (`exchangeRateCDF`, `vatRatePercent`,
`doubleSignatureThresholdUSD`), features (7 flags), contact, branding.
Seeds distants déjà présents (007 : 4 clés `*.defaults`).

### 2. Fichiers concernés
`PlatformSettingsManager.tsx` (UI + handlers :92-138), `ThemeContext.tsx`
(branding visuel, lecture seule — hors scope), `EnterpriseErpContext.tsx:697`
(constante `USD_TO_CDF_RATE` — lecture seule, hors scope),
`App.tsx`/`Footer` (lecture contact/branding via `platformConfig` — hors scope
écriture), nouveau `src/services/settingsService.ts`, nouveau hook
`useAppSettings` (ou extension contexte existant — décision §5).

### 3. Handlers concernés
`handleSaveRate` (:~105-121 : `setExchangeRate` + localStorage + audit local),
`handleToggleFeature` (:~123-138 : localStorage + audit local),
`handleSaveContact/branding` (même pattern). Tous : state → local → toast
« succès » sans confirmation serveur.

### 4. Service actuel
Aucun (logique inline dans le composant + `localStorage` + constante ERP).

### 5. Tables disponibles
`app_settings(key PK, value JSONB, category, updated_by, updated_at)` —
déployée et seedée (007). RLS : select/write `settings.view/manage`
(005) ; GRANT 008 OK.

### 6. Correspondance champ par champ
| UI | PG |
|---|---|
| `exchangeRateDraft/vatRate/doubleSignatureThreshold` | `finance.defaults` JSONB `{exchangeRateCDF, vatRatePercent, doubleSignatureThresholdUSD}` |
| `features` (7 booléens) | `features.defaults` JSONB (mêmes clés) |
| `contactDraft` (phone/email/address/website) | `contact.defaults` JSONB |
| branding (nom/slogan — via ThemeContext) | `branding.defaults` JSONB (+ lecture seule legacy) |
| `sessionTimeoutMins/maxLoginAttempts/lockoutDurationMins` | **hors scope** (états locaux sans persistance — à spécifier : `security.*` ou suppression) |
| `updated_by/updated_at` | serveur (`auth.uid()`, `now()`) |

### 7. CRUD
READ : `select * from app_settings` (une requête, `settings.view`).
UPDATE : `upsert(key, value)` (pas de CREATE/DELETE de clés par l'UI ;
nouvelles clés = migration). Dual-read transitoire : Supabase d'abord,
`localStorage` en repli lecture seule marqué LEGACY, suppression du repli
après 2 semaines de stabilité.

### 8. RLS attendu
Lecture/écriture refusées sans `settings.view/manage` (déjà en 005 — à
prouver par TEST J avec compte CLIENT : `select` → 0 ligne, `upsert` → refus).

### 9. Audit attendu
1 ligne `audit_logs(action='SETTINGS_UPDATED', resource='app_settings',
resource_id=key, actor=auth.uid(), metadata={old,new})` par save, écrite
après confirmation PG (pas avant). Lecture réservée `audit.view`.

### 10. Risques
R-W1 anomalie constatée : `setExchangeRate` appelé (`:107`) mais introuvable
dans `EnterpriseErpContext` (vérifié par recherche exhaustive ; `tsc` passe
malgré tout — cause exacte à trancher à l'implémentation). Conséquence :
sauvegarde du taux possiblement en échec silencieux/crash handler, ERP figé
à 2850. Le nouveau service contourne le problème (écriture PG directe).
R-W2 bandera : taux ERP lu depuis constante, pas depuis settings → la vague 1
ne change RIEN au calcul comptable (volontaire, Phase 5 branchera la lecture).
R-W3 clés `security.*` sans modèle → exclues, à spécifier.

### 11. Plan de migration (à autoriser)
a) `settingsService.ts` (`getAll/upsert`, erreurs propagées, pas de faux succès).
b) `PlatformSettingsManager` → service + états loading/error + toast succès
   APRÈS confirmation + relecture PG.
c) P0 reset sécurisé (modale + garde `isSuperAdmin`).
d) `tsc` + `build`.
e) Tests A-L (TEST J avec CLIENT réel, TEST L = ligne `audit_logs` serveur).

## Implémentation (GO autorisé — réalisée, en attente de validation distante)

### Fichiers créés
- `src/services/supabase/settingsService.ts` — `getSetting/upsertSetting`
  (erreurs propagées, relecture de confirmation, jamais de faux succès),
  `logSettingsAudit` (actor = id de session ; trigger 010 l'imposera serveur).
- `supabase/migrations/20261004_010_audit_actor.sql` — trigger
  `trg_audit_actor` : `actor_user_id := auth.uid()`, `created_at := now()`
  quand une session JWT existe (opérations service_role/SQL conservées).
  **À appliquer par l'opérateur** (non déployée par moi).

### Fichiers modifiés
- `ProjectDataContext.tsx` — `resetToDefaults` : no-op sauf
  `sessionStorage viva_reset_armed === 'RESET VIVA'` (scope Firestore+local,
  jamais Supabase). Appels directs existants (3 spots) = sans effet + warn.
- `ResetDatabaseModal.tsx` — réécrit : supprimés endpoint fantôme
  `/api/admin/reset-database`, `Bearer admin_general_token`, header
  `x-user-role`, OTP fictif. Gate `isSuperAdmin` (rôle DB), confirmation tapée
  `RESET VIVA`, portée affichée (local seul), audit honnête.
- `PlatformSettingsManager.tsx` — finance + features via service Supabase
  (chargement PG prioritaire, bannière d'erreur explicite, toasts succès
  APRÈS confirmation+relecture, revert en cas d'échec, audit serveur).
  Supprimés : écritures `viva_feature_flags`/`viva_exchange_rate`, appel mort
  `setExchangeRate` (P5 résolue : inexistant dans le contexte — le taux ERP
  reste la constante, aucun changement comptable). Général/contact/branding
  inchangés (familles CMS/visuel, hors vague).

### P1 — modèle audit
`audit_logs` permet l'attribution serveur **après 010** (trigger). Sans 010,
l'actor provient de l'id de session (mieux que champ libre, pas encore une
preuve). 010 proposée = correction minimale, à appliquer avec les tests.

### Résultats locaux
`tsc --noEmit` : PASS (0). `build` : PASS. Aucune autre famille touchée
(CRM/projets/ERP/CMS/menus/modules/formulaires/médias/orga intacts).

## Tests A-L (protocole, à exécuter après autorisation)
A create (upsert `features.defaults` flag test), B vérif SQL, C update taux
brouillon, D vérif SQL, E reload (valeur PG affichée), F logout/login
(persiste), G re-vérif, H 2e session staff (visible), I visible, J CLIENT
(select/upsert refusés), K refusé, L ligne audit serveur (`actor` = admin).
Critère succès : 12/12 + `tsc` + `build` + 0 écriture `viva_feature_flags/
viva_exchange_rate` après save.
