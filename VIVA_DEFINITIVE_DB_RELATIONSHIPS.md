# VIVA DEFINITIVE DB — RELATIONS
> Graphe cible. Légende : `─▶` FK N→1, `◀▶` N↔N (table de liaison), `(C)` cascade,
> `(R)` restrict, `(S)` set null.

## Identité & sécurité
- `profiles.id ─▶ auth.users.id (C)` ; `profiles.role_id ─▶ roles.id (R)`.
- `role_permissions ─▶ roles (C) + permissions (C)` ; `user_permissions ─▶
  profiles (C) + permissions (C)` ; `org_memberships ─▶ profiles (C) + org_units (C)`.
- `org_units.parent_id ─▶ org_units.id (C, anti-cycle)` ;
  `org_unit_modules ◀▶ org_units/modules`.

## CMS & plateforme
- `cms_sections.page_id ─▶ pages.id (S)` ; `cms_versions.section_id ─▶ sections (C)` ;
  `seo_meta.section_id ─▶ sections (C, UNIQUE)`.
- `menus.parent_id ─▶ menus.id (C)` ; `menus.module_id ─▶ modules.id (S)` ;
  `menu_permissions ◀▶ menus/permissions` ; `module_permissions ◀▶ existant`.
- `form_fields.form_id ─▶ forms (C)` ; `form_submissions.form_id ─▶ forms (C)` ;
  `form_workflows.form_id ─▶ forms (C, UNIQUE)` ; `form_submission_workflows ─▶
  submissions (C) + instances (C)`.
- `media_items ─▶ (aucune FK obligatoire)` ; `album_items ◀▶ albums/media` ;
  `youtube_videos` isolée ; `youtube_config` singleton (`id='main'`).

## CRM & portail
- `contacts.client_id ─▶ clients (C)` ; `crm_interactions.client_id ─▶ clients (C)`,
  `author ─▶ profiles (S)` ; `client_requests.owner ─▶ profiles (R)` ;
  `request_attachments ─▶ requests (C)` (+ objet Storage) ;
  `tickets.owner ─▶ profiles (R)` ; `ticket_messages.ticket_id ─▶ tickets (C)` ;
  `notifications.owner ─▶ profiles (C)` ; `client_documents.owner ─▶ profiles (R)`,
  `quote_id ─▶ quotes (S)`.

## Projets & ERP
- `projects.client_id ─▶ clients (S)` ; `project_members ◀▶ projects/profiles` ;
  `project_milestones/project_deliverables ─▶ projects (C)` ;
  `quotes.client_id/project_id ─▶ (S)` ; `quote_items.quote_id ─▶ quotes (C)`.
- `equipment_assignments ─▶ equipment (R) + projects (S)` ;
  `maintenance_logs.equipment_id ─▶ equipment (C)` ;
  `purchase_lines.request_id ─▶ purchase_requests (C)` ;
  `purchase_orders.request_id ─▶ requests (UNIQUE, R) + supplier_id ─▶ suppliers (R)`.
- `erp_transactions.performed_by/validators ─▶ profiles (S)` ;
  `reversed_by ─▶ erp_transactions.id (S)` ; `journal_entries.tx_id ─▶ transactions (C)`,
  `account_code ─▶ ohada_accounts.code (R)` ; `cash_closures.closed_by/validated_by ─▶ profiles (S)`.

## Transverse
- `audit_logs.actor_user_id ─▶ profiles (S)` ; `ai_actions.requester/decided_by ─▶ profiles (S)` ;
  `security_events.actor ─▶ profiles (S, nullable anon)` ;
  `workflows : steps/instances/transitions en cascade` ;
  `workflow_links` sans FK dure (module/entité dynamiques) + index.
- Index : toutes les FK + `(owner_profile_id, created_at)`, `reference/code`
  uniques, recherche `trgm` sur noms/titres (Phase DB), `status` partiels.

## Intégrité de migration (contrôles)
- Toute ligne owner-scopée a `owner_profile_id NOT NULL` (backfill = auteur
  Firestore si connu, sinon quarantaine `__unowned__` revue humaine).
- IDs Firestore non-UUID remappés (`legacy_id → uuid`, table de correspondance
  conservée jusqu'au cutover puis archivée).
- Doublons `content_key/code/reference/piece_reference` : `ON CONFLICT` avec
  règle PG-gagne documentée par entité + rapport de conflits.
