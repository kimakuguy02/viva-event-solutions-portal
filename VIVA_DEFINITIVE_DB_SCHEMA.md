# VIVA DEFINITIVE DB — SCHÉMA CIBLE
> Spécification (pas de migration créée). Conventions : `id UUID PK DEFAULT
> gen_random_uuid()` sauf mention ; `created_at/updated_at TIMESTAMPTZ NOT NULL
> DEFAULT now()` + trigger `set_updated_at()` ; montants `NUMERIC(14,2) CHECK >=0` ;
> devises `CHECK IN ('USD','CDF')` ; `owner_profile_id UUID REFERENCES profiles(id)`
> partout où un propriétaire existe ; JSONB uniquement si réellement variable.

## Socle (conservé, à compléter)
- `roles` : + `is_custom BOOLEAN DEFAULT false`, `position INT`.
- `permissions` : + `scope` (domaine). `role_permissions`, `profiles` : inchangés.
  NOUVEAU si besoin avéré : `user_permissions(profile_id, permission_id, granted_by,
  created_at)` — sinon retirer des specs.
- `app_settings(key PK, value JSONB, category)` : + `feature_flags` dédiée ?
  Décision : créer `feature_flags(code PK, name, description, is_enabled,
  env, target_roles TEXT[], starts_at, ends_at)` et migrer `features.defaults`.

## Organisation (R2-07)
- `org_units` : + `photo_url` (existe déjà ? non — ajouter `photo_url TEXT`),
  anti-cycle (trigger). NOUVEAU : `org_memberships(profile_id, unit_id,
  is_manager BOOLEAN, PK composite)`, `org_unit_modules(unit_id, module_id)`.

## CMS (R2-11→R2-15)
- `cms_sections` : + `page_id FK pages(id)`, `position INT`, `scheduled_at`,
  `published_by FK profiles`, statut CHECK +`review`.
- NOUVEAU : `pages(slug UNIQUE, title, is_published, position)`,
  `seo_meta(section_id UNIQUE FK, meta_title, meta_desc, slug, og_image, noindex)`.
- `cms_versions` : + `diff_summary`, `restored_from UUID`.

## Menus/Modules/Forms (R2-03→R2-06, R2-09/10)
- `menus` : + `parent_id FK menus(id)`, `badge`, `open_in_new_tab BOOLEAN`,
  `display_name`, `module_id FK modules(id)`.
- `modules` : + `code UNIQUE`, `route`, `version`, `visibility`, `position`,
  `feature_flag FK feature_flags(code)`.
- `form_fields` : + `help_text`, `validation`, `section`, `visible_roles TEXT[]`,
  CHECK élargi (`module,client,project`).
- NOUVEAU : `menu_permissions(menu_id, permission_id)`,
  `form_workflows(form_id UNIQUE, workflow_id, initial_step, sla_days)`,
  `form_submission_workflows(submission_id, instance_id)`.

## Médias (R2-16→R2-19)
- `media_items` : + `metadata JSONB` (caption, projet, dates), + `owner_profile_id`.
- NOUVEAU : `albums(id, title, cover_media_id)`, `album_items(album_id, media_id)`,
  `realizations(id, title, description, client_label_autorise, location, date,
  tags TEXT[], featured)` — montants/clientsophilés jamais publics sans flag.

## Clients/CRM (R3)
- `clients` : + `owner_profile_id` exploité, `fidelity_tier` en vue calculée.
- NOUVEAU : `contacts(id, client_id FK cascade, name, role, email, phone, notes)`,
  `crm_interactions(id, client_id FK, author_profile_id (=auth.uid() forcé),
  type, summary, next_action, due_at)`, vue `v_client_timeline` (UNION labellisée).

## Demandes/Tickets/Notifications/Documents (R3-02→R3-06, R4-25/26)
- NOUVEAU : `client_requests(reference UNIQUE, owner_profile_id NOT NULL, objet,
  service, description, status, priority, created_at)` + `request_attachments`
  (Storage `quotes`) ; `tickets(reference UNIQUE, owner NOT NULL, sujet,
  catégorie, priorité, statut, created_at)` + `ticket_messages(ticket_id,
  author_profile_id, body, created_at)` ; `notifications(id,
  owner_profile_id NOT NULL, catégorie, titre, lien, priorité, read_at)` (écriture
  serveur/Edge uniquement) + `notification_deliveries` + `notification_preferences`.
- `client_documents(id, owner NOT NULL, quote_id?, type, storage_path, created_at)`.

## Projets/ERP (R4-01→R4-23)
- `projects` : + `priority`, `archived BOOLEAN`, `description`,
  `milestones JSONB` transitoire → table `project_milestones(id, project_id FK
  cascade, title, date, owner_profile_id, status, priority)` ;
  `project_members(project_id, profile_id, role_operationnel)` ; livrables →
  `project_deliverables(id, project_id, name, status, url)`.
- `quotes` : + `valid_until, conditions, discount_usd, accepted_by/at, viewed_at` ;
  références non séquentielles.
- `equipment(code UNIQUE, name, category, qty_total, qty_available, location,
  condition, daily_rate_usd)` ; `equipment_assignments(equipment_id, project_id,
  qty, assigned_by, assigned_at, returned_at)` ; `maintenance_logs`.
- `suppliers(company UNIQUE, category, email, phone, address, status)` +
  `supplier_contacts` ; `purchase_requests(reference UNIQUE, requester (=auth.uid()
  forcé), direction, project_id, justification, currency, status)` +
  `purchase_lines` ; `purchase_orders(request_id UNIQUE, supplier_id, total, status)`.
- `erp_transactions` : + `reversed_by FK`, catégories `avance/remboursement/
  transfert/ajustement` ; RPC `erp_validate` / `erp_reverse` (jamais d'UPDATE
  direct) ; `ohada_accounts(code PK, label, classe, type)` + `journal_entries
  (tx_id, account_code FK, debit, credit)` + contrainte partie double +
  `journals` ; `treasury(opening_balances, balances calculés, reconciliations)`.
- `cash_closures` : + `validated_by/at`, statuts workflow OPEN→CLOSED.

## Workflows/IA/Sync/Audit (R2-02, R4-24→R4-35)
- `workflows`, `workflow_steps`, `workflow_instances`, `workflow_transitions`,
  `workflow_links(module, entity, entity_id, instance_id)`.
- `ai_actions(id, requester, kind, payload JSONB, status, decided_by, decided_at)`.
- `security_events(id, kind, actor, detail, level, created_at)`.
- `sync_operations(operationId UNIQUE, entity, entityId, op, timestamp, actor,
  payload JSONB, status, retryCount, error)` ; `audit_logs` + `before/after JSONB`.
- Archivage : audit/security/ai irréversibles (jamais DELETE) ; transactions
  `valide` via contrepassation ; suppressions métier = `archived`/RESTRICT avec
  dépendances ; médias : ligne + objet Storage couplés.
- Concurrence : `updated_at` optimiste sur contenus (relecture obligatoire),
  `operationId` idempotent côté sync, séquences serveur pour références.
