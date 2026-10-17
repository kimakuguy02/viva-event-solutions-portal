# VIVA DEFINITIVE DB — PLAN DE MIGRATION (fichier par fichier)
> Aucune migration créée ici. Ordre strict, chaque étape vérifiée avant la
> suivante. Principe : ADDITIF d'abord (nouvelles tables/colonnes NULLables),
> backfill, contraintes NOT NULL, bascule lectures, suppression legacy en dernier.

## Vague A — fondations manquantes (sans toucher l'existant)
- A1 : colonnes `roles.is_custom`, `profiles` inchangée, `user_permissions`(si tranché).
- A2 : `feature_flags` + trigger de migration depuis `features.defaults`.
- A3 : `pages`, `seo_meta`, `cms_sections.page_id/position/scheduled_at/published_by`,
  statut `review`.
- A4 : `menus.parent_id/badge/open_in_new_tab/display_name/module_id`,
  `menu_permissions`, modules (`code/route/version/visibility/position/
  feature_flag/menu_id/dependencies`), `form_fields(help_text/validation/
  section/visible_roles + CHECK élargi)`, `media_items(metadata, owner)`.
- Vérifications : `\d`, RLS ON, policies présentes, seeds intacts.

## Vague B — CRM/portail (cœur isolation)
- B1 : `contacts`, `crm_interactions`, `client_requests(+attachments)`,
  `tickets(+messages)`, `notifications(+deliveries+prefs)`, `client_documents`,
  vue `v_client_timeline`.
- B2 : backfill `owner_profile_id` (auteur Firestore si connu, sinon quarantaine
  `__unowned__` + revue humaine) puis `SET NOT NULL`.
- B3 : tests A↔B rejoués sur chaque table owner-scopée + RPC `ticket_create`
  si spam.

## Vague C — projets/ERP/finance
- C1 : `projects(+priority/archived/description)`, `project_members/milestones/
  deliverables`, `equipment(+assignments/maintenance)`, `suppliers(+contacts)`,
  `purchases(+lines/orders)`, `quotes(+valid_until/conditions/accepted/viewed)`.
- C2 : `erp_transactions.reversed_by` + catégories, RPC `erp_validate`/
  `erp_reverse`, `ohada_accounts` seed officiel + `journal_entries` (+contrainte
  partie double) + `journals`, `treasury` (opening/balances/reconciliations),
  `cash_closures.validated_by/at`.
- C3 : rejouer TEST 2/3 financiers (insert `valide` direct refusé, `UPDATE`
  `valide` refusé, contrepassation liée OK).

## Vague D — workflows/IA/sync/audit
- D1 : `workflows/steps/instances/transitions/links`, `form_workflows`,
  `ai_actions`, `security_events`, `sync_operations`, `audit.before/after`,
  `org_memberships/org_unit_modules`.
- D2 : Edge `sync-push` (remplace `/api/sync/push`), `notifications_dispatch`,
  `gemini_ask` (jamais de clé frontend).

## Vague E — données historiques (miroirs comme source)
- E1 : export Firestore/JSON/local → staging, table de correspondance
  `legacy_id→uuid`, `ON CONFLICT` PG-gagne documenté par entité, rapport de
  conflits, quarantaine + revue humaine, `INITIAL_*`/démo jamais migrés comme
  production (PII purgées).
- E2 : bascule lectures (overlay → direct), suppression miroirs, décommission
  Firebase/Express, `resetToDefaults` retiré, secrets rotationnés, backups/PITR,
  rate-limit/CSP/headers, tests E2E A↔B, monitoring.

## Réversibilité
Chaque vague : `down` = DROP des seuls objets créés (jamais de données prod) ;
sauvegarde pré-migration obligatoire ; cutover avec feature-flag + rollback
documenté. Ordre de création définitif : A → B → C → D → E.
