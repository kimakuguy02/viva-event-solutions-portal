# VIVA PHASE 4 — DATA FLOW & SUPER ADMIN AUDIT
> Lecture seule. Aucun fichier modifié. Réf : audits Phase 0/1, rapports Phase 2/3.

## 1. Executive summary

Toutes les écritures applicatives vont vers **Firestore direct + localStorage +
IndexedDB + Express JSON** ; **zéro écriture Supabase** dans les flux (le client
`supabase.ts` n'est importé que par `AuthContext`). Le Super Admin (19 onglets)
écrit en React state + Firestore + `viva_audit_logs` local — aucune persistance
PostgreSQL, aucun audit serveur. 61 sites d'écriture Firestore, 28
`localStorage.setItem`, 2 bases IndexedDB. Migration estimée par vagues
§15. Aucune donnée à supprimer avant migration.

## 2. Architecture actuelle

```
UI (admin/staff/client/visiteur)
 ↓ setState + persistCache (localStorage viva_*, ~25 clés)
 ↓ setDoc/updateDoc/deleteDoc Firestore direct (61 sites, catch→warn)
 ↓ onSnapshot écrase le state (Firestore = SSOT de fait)
Parallèle : IndexedDB (sync queue + ERP stores) → POST /api/sync/push → JSON
Audit : logAuditEvent Firestore (champs libres) + 8 writers localStorage
Auth (Ph.2) : seul flux Supabase-first (profiles/roles)
```

## 3. Architecture cible

```
SUPER_ADMIN → Auth (session Supabase) → permission (has_permission)
 → service/repository (src/services/*, erreurs propagées, jamais de faux succès)
 → Supabase (RLS) → PostgreSQL/Storage
 → audit serveur (trigger/Edge, actor = auth.uid())
 → succès confirmé → UI refresh (relecture, pas d'optimisme aveugle)
Échec → erreur exploitable affichée, rien en local, retry explicite.
```

## 4. Cartographie complète des écritures

| # | Fichier : fonction | READ/WRITE | Source actuelle | Table Supabase cible | Statut | Risque / Correction |
|---|---|---|---|---|---|---|
| 1 | ProjectDataContext : 15 `useState` init | R | `localStorage viva_*` → `INITIAL_*` | — (init) | 🔴 | Démarrage sans Supabase ; corr : init + subscribe Supabase, local = cache seul |
| 2 | ProjectDataContext : `persistCache` (:331-353, 13 `useEffect`) | W | localStorage (13 clés) | — (cache) | 🟠 | Conserver comme cache, renommer `cache`, jamais lu comme vérité |
| 3 | ProjectDataContext : 12 `onSnapshot` (:357-468) | R | Firestore 11 collections + `platform_config`×2 | `projects, media_items, menus, modules, forms, org_units, cms_sections, equipment→?` | 🔴 | Migrer vers Realtime Supabase + RLS ; `equipment/partners/departments` : table `equipment`/`partners` à créer (ABSENT PG) ou mapper |
| 4 | ProjectDataContext : `updateDirectionsOrg/add/update/deleteOrgUnit` (:472-531) | W | Firestore `organization_directions/units` + state | `org_units` | 🔴 | Service `organizationService` + RLS `organization.manage` |
| 5 | ProjectDataContext : `updateDynamicMenus/Modules` (:533-577) | W | Firestore + state + `logAuditEvent` client | `menus`, `modules` | 🔴 | `menuService/moduleService`, audit serveur |
| 6 | ProjectDataContext : `add/update/deleteDynamicForm`, `submitDynamicForm` (:579-650) | W | Firestore `dynamic_forms/submissions` (soumission anonyme possible) | `forms, form_fields, form_submissions` | 🔴 | `formService`, soumission publique = insert RLS prévu, anti-spam Edge |
| 7 | ProjectDataContext : `add/update/deleteMediaItem`, `updateYouTubeConfig` (:652-702) | W | Firestore `media/platform_config` (fichier réel = Firebase Storage) | `media_items, youtube_config/videos` + buckets | 🔴 | `mediaService` (Storage + metadata couplés, plus de faux succès) |
| 8 | ProjectDataContext : `updateCmsSections/saveCmsDraft/publishCmsItem/updatePlatformConfig` (:704-856) | W | Firestore `cms_sections/platform_config` + versions locales | `cms_sections, cms_versions, app_settings` | 🔴 | `cmsService` (draft/published, versions serveur, sanitize XSS) |
| 9 | ProjectDataContext : `add/updateDepartment` (:858-884) | W | Firestore `departments` + `POLES_15` | `org_units` (pôles = unités type service) ou table `departments` à créer | 🟠 | Décider modèle : mapper pôles→`org_units`, sinon migration dédiée |
| 10 | ProjectDataContext : `addProject/updateProjectStatus/submitQuote/updateQuote/updateEquipment/updatePartner` (:886-1021) | W | Firestore `projects/quotes/equipment/partners` + state | `projects, quotes(+items), equipment?, partners?` | 🔴 | `projectService/quoteService` ; créer tables `equipment, partners` ou stocker en `app_settings`/docs (décision Ph.5) |
| 11 | ProjectDataContext : `resetToDefaults` (:1070-1111) | W destructif | Réécrit Firestore + purge `viva_*` | — | 🔴 | SUPPRIMER ou restreindre SUPER_ADMIN + confirmation + jamais en prod |
| 12 | EnterpriseErpContext : 10 `useState` + `loadFromOfflineStore` (:127-187) | R | localStorage + IndexedDB + `INITIAL_*` | `clients, erp_tasks/transactions, cash_closures` | 🔴 | Init Supabase + RLS `erp.*` ; IndexedDB = cache |
| 13 | EnterpriseErpContext : 3 `onSnapshot` (:189-249, merge par id) | R/W implicite | Firestore `erp_transactions/tasks`, `crm_clients` | idem | 🔴 | Realtime + résolution conflit serveur-gagne |
| 14 | EnterpriseErpContext : `addCrmClient/updateStatus/addInteraction` (:302-345) | W | Firestore `crm_clients` + state (interactions locales seules) | `clients` (+ table `crm_interactions` à créer) | 🔴 | `clientService` ; interactions jamais persistées distant → perte actuelle |
| 15 | EnterpriseErpContext : `addTransaction/approveManager/validateDafOtp/reverse/createClosure` (:347-566) | W | Firestore + state, **validation 100 % cliente** | `erp_transactions, cash_closures` + RPC | 🔴 | RPC `erp.validate`/`reverse` serveur (double-signature jamais cliente) |
| 16 | EnterpriseErpContext : `addTask/updateTask/addReport/loans/maintenance/notices` (:568-683) | W | state + Firestore partiel (reports/loans/maintenance/notices **jamais persistés distant**) | `erp_tasks` (+ tables prêts/maintenance/notices à créer) | 🔴 | Décider périmètre : migrer ou purger les modules fantômes |
| 17 | syncService : `queueMutation/flushQueue/pullServerData` | W | IndexedDB + `localStorage viva_sync_queue` → `POST /sync/push` (sans authz) | Supabase upsert | 🔴 | Rebrancher upsert + résultats par item + Edge authz ; jamais de `clear()` global |
| 18 | offlineDb : `saveToOfflineStore/loadFromOfflineStore` (8 stores) | R/W | IndexedDB + miroir localStorage | — (cache) | 🟡 | Conserver, prefixer `cache:`, TTL + invalidation au login |
| 19 | apiClient : token `viva_auth_token` localStorage | R/W | localStorage | — (supprimé par Supabase session) | 🟠 | Supprimer à la fin du repli legacy |
| 20 | Admin managers (8 fichiers) : `logAudit` + `handleSaveUsers` + settings | W | `localStorage viva_audit_logs/managed_users/feature_flags/exchange_rate` | `audit_logs, profiles/roles, app_settings` | 🔴 | Tous rewires vers services + audit serveur (détail §5) |
| 21 | ClientPortal (:259-268), ClientAuthModal (ancien), modals | W | `viva_audit_logs` local, ex-`loginAsClient` (supprimé Ph.2) | `audit_logs` / Auth | 🟡 | Partiellement corrigé Ph.2 ; reste audit local → serveur |
| 22 | visitorTrackingService (sessions + PII démo) | W | localStorage + `INITIAL_DEMO_VISITORS` | — (analytics à part, consentie) | 🟠 | Purger PII démo ; tracking futur = table dédiée + consentement, jamais PII en dur |
| 23 | storageService | W | Firebase Storage + **fallback URL forgée** | Buckets 006 + `media_items` | 🔴 | Réécrire : erreur = erreur, suppression couplée |
| 24 | server/api `sync/push`, CRUD cms/menus/settings/users | W | JSON `viva_database.json` | Supabase (tous domaines) | 🔴 | Geler, puis décommission (Phase 10) ; `sync/push` = SEC-04 ouvert |
| 25 | ThemeContext (`viva_active_theme_*`) | W | localStorage | — (préférence, acceptable) | 🟢 | Conserver (non critique), unifier les clés v2/v3 |

## 5. Cartographie SUPER_ADMIN (19 onglets)

| Onglet | Handler → service actuel → cible | Table cible | Audit actuel → cible |
|---|---|---|---|
| overview (compteurs) | longueurs React | — (vues) | — → vues SQL `COUNT` réelles |
| site-editor / pages-contents | `CmsAdvancedEditor` → `updateCmsSections/saveCmsDraft/publish` → Firestore+local | `cms_sections/versions` | local → trigger/Edge |
| menus-nav | `MenuManager` → `updateDynamicMenus` → Firestore+local | `menus` | local → serveur |
| modules (+features) | `ModuleManager` → `updateDynamicModules` → Firestore+local | `modules/module_permissions` | local → serveur |
| forms | `DynamicFormsManager` → context → Firestore | `forms/fields/submissions` | local → serveur |
| media/photos/videos-yt | `MediaManager` → context + Firebase Storage (faux succès) | `media_items/youtube_*` + buckets | aucun → serveur |
| organigramme | `OrganizationalStructureManager` → context → Firestore+local | `org_units` | local → serveur |
| users / roles-perms | `RolesAndUsersManager` → `localStorage viva_managed_users` | `profiles/roles/role_permissions` | local → Edge SUPER_ADMIN |
| config/branding | `PlatformSettingsManager` → localStorage flags/taux | `app_settings` | local → serveur |
| gemini-ai | panneau statique | `ai_actions` (à créer Ph.7) | — |
| audit-history/security/firebase-state | `TechArchitectureViewer` + `localStorage` | `audit_logs` (lecture `audit.view`) | local → serveur |
| GlobalSiteEditor, VisualEditOverlay | idem CMS | `cms_sections` | idem |

## 6. Sources de vérité restantes

Firestore (runtime), JSON Express (backend legacy), localStorage ~25 clés (SSOT de fait : users, CMS, ERP, audit, settings), IndexedDB ×2 (ERP + queue), `INITIAL_*` (réensemencent silencieux), mémoire React (live/polls/tickets non persistés).

## 7. Firebase restant

Auth (repli), 16 collections Firestore lues/écrites (`users, quotes, projects, equipment, partners, departments, organization_directions/units, dynamic_menus/modules/forms, form_submissions, cms_sections, media, platform_config, erp_transactions/tasks, crm_clients, erp_closures, audit_logs`), Storage. Gel nouveautés actif, 0 ajout depuis Phase 1.

## 8. localStorage restant

`viva_auth_token` (repli), `viva_managed_users`, `viva_audit_logs`, `viva_platform_config/departments/projects/quotes/equipment/partners/directions_org/org_units/dynamic_menus/modules/forms/submissions/cms_sections/media_items/youtube_config`, `viva_erp_*` (10), `viva_visitor_sessions`, `viva_sync_queue`, `viva_feature_flags`, `viva_exchange_rate`, `viva_active_theme_*`, `viva_supabase_auth` (légitime), `viva_current_visitor_id`.

## 9. IndexedDB restant

`viva_sync_engine_db` (queue + entity_cache), `viva_enterprise_erp_db` (8 stores). Rôle futur : cache/queue uniquement (RULE-012).

## 10. mockData restant

`vivaData.ts` (projects/quotes/equipment/partners/tickets), `platformConfig.ts` (config + `POLES_15`), `enterpriseErpData.ts` (employés/CRM/transactions/tâches…), `cmsAndErpDefaults.ts` (directions/menus/modules/CMS/médias/forms/youtube), `INITIAL_DEMO_VISITORS` (+PII), `INITIAL_QUESTIONS/POLL`, `INITIAL_MANAGED_USERS`, `demo client` (`ClientAuthModal`), `LiveQuestions` mémoire. Devenir : seeds PG institutionnels (déjà 003/007 partiels) puis suppression des fallbacks.

## 11. Services concernés

`firebase.ts` (wrappers + `logAuditEvent` forgeable), `storageService.ts` (faux succès), `syncService.ts`/`offlineDb.ts` (rebrancher), `apiClient.ts` (repli), `visitorTrackingService.ts` (purger), `supabase.ts` (seul sain). À créer : `cmsService, menuService, moduleService, formService, mediaService, organizationService, settingsService, clientService, projectService, quoteService, erpService(RPC), auditService(serveur), profileService, roleService`.

## 12. Tables Supabase correspondantes

Couverture OK sauf : `equipment`, `partners`, `departments/pôles`, `crm_interactions`, `tickets`, `employee_profiles`, `loans`, `maintenance`, `notices`, `live`, `workflows`, `notifications`, `contacts`, `executive_board`, `ai_actions` → statuer : créer (Ph.5-7) ou purger le module fantôme. `user_permissions` (mentionnée specs, absente du schéma) → créer si besoin avéré, sinon retirer des specs.

## 13. Risques

R4-1 reset destructif accessible (`resetToDefaults`) ; R4-2 soumissions anonymes sans quota ; R4-3 montants calculés navigateur ; R4-4 merges last-write-wins ; R4-5 suppressions Firestore sans Storage ; R4-6 audit local = preuve nulle ; R4-7 `INITIAL_*` réensemencent ; R4-8 PII démo en prod ; R4-9 61 writes sans transaction.

## 14. Corrections par priorité

P0 : services + RLS wiring CMS/settings/menus (lecture), audit serveur, suppression faux succès upload, `resetToDefaults` neutralisé. P1 : writes menus/modules/forms/orga/médias/YouTube, quotes/projects/clients, `sync/push` sécurisé ou gel. P2 : ERP/RPC double-signature, Storage couplé, Realtime, purge démo/PII, tables manquantes.

## 15. Ordre exact de migration

1. `auditService` + policies lecture (base de confiance). 2. Lecture CMS/settings/menus/modules (public). 3. Écritures CMS/menus/modules + `app_settings`. 4. Forms + submissions (+anti-spam). 5. Orga + users/roles (Edge admin). 6. Médias/Storage/YouTube. 7. Clients/projets/devis. 8. ERP + RPC + cash. 9. Realtime + offline resync + purge mocks + `resetToDefaults` supprimé. 10. Cutover + décommission.

## 16. Fichiers à modifier

`ProjectDataContext` (découpe en services), `EnterpriseErpContext` (idem + RPC), 8 managers admin, `MediaManager`, `storageService`, `syncService/offlineDb`, `apiClient`, `visitorTrackingService`, `ThemeContext` (clés), `server/api` (gel), `App/RequireRole` (étendre).

## 17. Fichiers à créer

14 services (§11), `src/lib/supabaseTables.ts` (noms/colonnes), `supabase/functions/*` (admin-assign-role, erp-validate, gemini-ask plus tard, anti-spam), migrations `equipment/partners/departments` ou doc de mapping, `workflows/notifications/contacts` (Ph.5-7), tests RLS `tests/rls/*.test.ts` (Phase 9).

## 18. Tests à effectuer

Par vague : insert/update/delete autorisé + refusé (owner, cross-client A↔B, anon, staff hors périmètre), persistance reload/login, audit ligne serveur (`actor=auth.uid()`), upload→metadata→lecture refusée→delete couplée, queue offline→flush→convergence, `tsc`+`build`, 0 `viva_*` métier après cutover.
