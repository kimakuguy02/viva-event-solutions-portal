# VIVA DEFINITIVE DB — BLUEPRINT DES MIGRATIONS A→E
> Plan détaillé, aucune migration créée. Convention de nommage :
> `YYYYMMDD_0NN_domaine.sql`. Chaque migration : prérequis, objets, compat
> (ADDITIF d'abord), tests, vérification, retour arrière.

## Vague A — fondations (prérequis : 001→011 appliquées)
- A1 `roles_permissions_extend` : `roles.is_custom/position`, `permissions.scope`.
  Compat : ADDITIF pur. Test : seeds inchangés. Rollback : DROP colonnes.
- A2 `feature_flags` : table + trigger de migration depuis `features.defaults`
  (copie, pas de suppression). Test : parité des 7 flags. Rollback : DROP table.
- A3 `cms_pages_seo` : `pages`, `seo_meta`, colonnes `cms_sections(page_id/
  position/scheduled_at/published_by)`, CHECK `review`. Compat : NULLables.
  Test : CRUD + RLS publié/brouillon. Rollback : DROP dans l'ordre inverse.
- A4 `platform_rich` : `menus(parent_id/badge/open_in_new_tab/display_name/
  module_id)`, `menu_permissions`, `modules(code/route/version/visibility/
  position/feature_flag/menu_id/dependencies)`, `form_fields(help_text/
  validation/section/visible_roles + CHECK)`, `media_items(metadata/owner)`.
  Compat : NULLables, CHECK élargi (valeurs existantes conformes). Test :
  hiérarchie + anti-cycle, JSONB valide. Rollback : DROP colonnes/tables.
- Passage A→B : catalogue RLS relu (`pg_policies`), 0 ligne orpheline.

## Vague B — CRM/portail (prérequis : A)
- B1 `crm_portal` : `contacts`, `crm_interactions` (auteur forcé : trigger
  `author=auth.uid()` analogue à 010), `client_requests(+attachments)`,
  `tickets(+messages)`, `notifications(+deliveries+prefs)`, `client_documents`,
  vue `v_client_timeline`. Compat : nouvelles tables. Test : cycle de vie
  complet + RLS owner + anon-insert throttlé.
- B2 `ownership_backfill` : ajout `owner_profile_id` (NULLable) →
  backfill (auteur connu / quarantaine `__unowned__`) → `SET NOT NULL` →
  policies owner. Test : 0 NULL, quarantaine revue. Rollback : ne JAMAIS
  re-NULLer en prod (réparer avant).
- B3 `fidelity_view` : `fidelity_tier` calculé (vue, pas de colonne).
- Passage B→C : TEST A↔B rejoué sur chaque table owner-scopée.

## Vague C — projets/ERP/finance (prérequis : B)
- C1 `projects_erp_extend` : `projects(+priority/archived/description)`,
  `project_members/milestones/deliverables`, `equipment(+assignments/
  maintenance)`, `suppliers(+contacts)`, `purchases(+lines/orders)`,
  `quotes(+valid_until/conditions/accepted/viewed)`, `reference_mint` (RPC,
  séquences par préfixe). Compat : ADDITIF. Test : RLS croisée + références uniques.
- C2 `finance_secure` : `erp_transactions.reversed_by` + catégories, RPC
  `erp_validate`/`erp_reverse`, `ohada_accounts` seed + `journal_entries` +
  contrainte partie double + `journals`, `treasury(opening/balances/
  reconciliations)`, `cash_closures.validated_by/at`. Test : insert `valide`
  direct refusé, UPDATE `valide` refusé, contrepassation liée OK, balance
  équilibrée, clôture bout-en-bout.
- Passage C→D : TEST financiers 2/3 rejoués + revue OHADA métier.

## Vague D — workflows/IA/sync/audit (prérequis : C)
- D1 `platform_runtime` : `workflows/steps/instances/transitions/links`,
  `form_workflows`, `ai_actions`, `security_events`, `sync_operations`,
  `audit(before/after)`, `org_memberships/org_unit_modules`. Test : cycle
  complet + notifications + conflits simulés.
- D2 Edge : `sync-push`, `notifications-dispatch`, `gemini-ask`, `ticket-create`
  (si spam). Test : contrat + idempotence + RBAC nié sans droit.
- Passage D→E : gel du schéma (plus aucun DDL métier après, sauf correctif).

## Vague E — données + cutover (prérequis : D)
- E1 staging→prod : export legacy → staging, table `legacy_id→uuid`,
  `ON CONFLICT` PG-gagne par entité, rapport de conflits, quarantaine,
  PII purgées, `INITIAL_*` jamais migrés en production.
- E2 bascule : lectures overlay→direct par famille (feature-flag),
  suppression miroirs, décommission Firebase/Express, `resetToDefaults` retiré,
  rotation secrets, backups/PITR vérifiés, E2E A↔B, monitoring.
- Rollback : par famille (flag), jamais de restore global sans sauvegarde.

## Règles transverses
Idempotence (`IF NOT EXISTS`/`ON CONFLICT`), 0 `TRUNCATE/DROP TABLE` prod,
sauvegarde pré-vague, `down` documenté (objets créés uniquement), numérotation
immuable (correctif = nouvelle migration, jamais de réécriture).
