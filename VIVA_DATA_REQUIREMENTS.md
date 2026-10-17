# VIVA DATA REQUIREMENTS — spécifications base définitive
> SPECIFICATION uniquement — AUCUNE migration créée (Phase 2.2).
> Convention : tables `public.*`, UUID `gen_random_uuid()`, RLS deny-by-default,
> audit via `audit_logs` (acteur = `auth.uid()` forcé serveur), seeds idempotents.

## R2-01 — rôles personnalisés (+ grants)
- Objectif : persister rôles custom créés dans RolesPermissionsManager + leur matrice.
- Réutilise : `roles` (+ colonne `is_custom boolean default false` via ALTER),
  `role_permissions`, `permissions` (+ nouvelles permissions custom avec CHECK assoupli
  ou table `custom_permissions`).
- RLS : lecture `roles.view`, écriture via Edge SUPER_ADMIN (`permissions.assign`).
- Audit : `ROLE_CREATED/GRANTS_UPDATED`. Risque : prolifération de rôles → garde-fou `is_system`.

## R2-02 — workflows (moteur)
- Tables : `workflows(id, code UNIQUE, name, description, target_audience, is_active)`,
  `workflow_steps(id, workflow_id FK cascade, key, label, responsible_role FK roles.code,
  due_days, position)`, `workflow_instances(id, workflow_id, subject_type, subject_id,
  current_step, status, due_at)`, `workflow_transitions(instance, from, to, actor, at, note)`.
- RLS : définition SUPER_ADMIN ; instances visibles selon rôle responsable + owner.
- Audit : chaque transition. Risque : notifications (table `notifications` à prévoir).

## R2-03 — menus dynamiques (hiérarchie)
- `menus` + colonnes `parent_id FK menus(id)`, `badge`, `open_in_new_tab`,
  `display_name`, `module_id FK modules(id)`. Index `(parent_id, position)`.
- RLS : lecture publique restreinte (`is_active AND visibility='public'`),
  écriture `menus.manage`. Migration des `parentId` session actuels.
- Audit : `MENUS_UPDATED`.

## R2-04 — modules dynamiques (modèle riche)
- `modules` + colonnes `code UNIQUE`, `route`, `version`, `visibility`,
  `position`, `feature_flag FK app_settings(key)`, `menu_id FK menus(id)`,
  `dependencies UUID[]` (ou table `module_dependencies`).
- RLS : lecture selon visibilité, écriture `modules.create/update`.
- Audit : `MODULES_UPDATED`.

## R2-05 — formulaires dynamiques (champs riches)
- `form_fields` + colonnes `help_text`, `validation`, `section`,
  `visible_roles TEXT[]`, types `module/client/project` (élargir le CHECK).
- RLS : lecture selon audience du form, écriture `forms.create/update`,
  soumissions : insert public + lecture owner/staff (`forms.manage`).
- Audit : `DYNAMIC_FORM_*`. Risque : pièces jointes → Storage `forms` bucket à créer.

## R2-06 — champs : voir R2-05 (même table).

## R2-07 — organisation dynamique
- `org_units` + colonnes `photo_url` (existe), table `org_memberships`
  (`profile_id`, `unit_id`, `is_manager`) pour membres/rattachements,
  `org_unit_modules` (`unit_id`, `module_id`).
- RLS : lecture publique `is_active`, écriture `organization.manage`.
- Audit : `ORGANIZATION_*`. Risque : photo Storage + cycles hiérarchiques (CHECK anti-cycle via trigger).

## R2-08 — feature flags (métadonnées)
- `feature_flags(code PK, name, description, is_enabled, env, target_roles TEXT[],
  starts_at, ends_at)` — remplace le JSON `features.defaults` + métadonnées session.
- RLS : lecture publique des flags actifs `env=production`, écriture `settings.manage`.
- Audit : `FEATURE_FLAG_TOGGLED`. Risque : évaluation temporelle (dates) côté Edge/lecteur.

## R2-09 — associations rôle ↔ module ↔ permission
- `module_permissions` existe : ajouter `menu_permissions(menu_id, permission_id)` si besoin ;
  exposer une vue `v_role_coverage(role, module, menu, permission)`.
- RLS : lecture `roles.view`. Audit : via `permissions.assign`.

## R2-10 — associations formulaire ↔ workflow
- `form_workflows(form_id UNIQUE, workflow_id FK, initial_step, sla_days)` +
  `form_submission_workflows(submission_id, instance_id)`.
- RLS : gestion `forms.create`, lecture selon form. Audit : `FORM_WORKFLOW_LINKED`.
- Dépend de R2-02. Risque : soumissions orphelines si workflow supprimé (RESTRICT).

## R4-01 → R4-11 — Projets / planning / équipes / équipements / logistique (Prompt 2)
- R4-01 Projects : `projects` existe — ajouter `priority`, `archived`, `description`,
  `detailedMilestones`, `detailedDeliverables`, `team TEXT[]` (+ `quote_items` exploité).
  RLS : lecture owner/staff `projects.manage`, écriture `projects.create/update`.
  Audit : `PROJECT_*`. Risque : champs riches hors PG (miroir) jusqu'à migration.
- R4-02 Events : événement = projet `event_type` + brief (client, dates, lieu, budget) —
  pas de table séparée sauf besoin confirmé (alors `events(project_id UNIQUE, brief JSONB)`).
- R4-03 Project teams : `team TEXT[]` transitoire → cible `project_members(project_id,
  profile_id, role_operationnel)` ; lecture owner/staff.
- R4-04 Tasks : `erp_tasks` existe — ajouter `blocked`/`cancelled` aux CHECK,
  `progress`, `depends_on UUID[]` ; Kanban déjà mappé.
- R4-05 Milestones : `project_milestones(id, project_id FK cascade, title, date,
  owner_profile_id, status, priority)` ; RLS owner/staff.
- R4-06 Retroplanning : vue `v_project_schedule` (milestones + tâches + échéances) ;
  calculs côté lecture, jamais stockés.
- R4-07 Equipment : table `equipment(code UNIQUE, name, category, quantity_total,
  quantity_available CHECK, location, condition, daily_rate_usd)` (remplace le type TS).
- R4-08 Assignments : `equipment_assignments(id, equipment_id, project_id, qty,
  assigned_by, assigned_at, returned_at)` ; disponibilité = calculée, jamais saisie ;
  RLS `equipment.manage`.
- R4-09 Maintenance : `maintenance_logs(id, equipment_id, type, description, cost_usd,
  performed_by, performed_at, next_due)` ; pièces jointes Storage `erp`.
- R4-10 Logistics : `logistics_ops(id, project_id, kind[transport,vehicule,hebergement,
  accueil,livraison], detail JSONB, status, owner)` ; RLS owner/staff.
- R4-11 Suppliers : `suppliers(id, company UNIQUE, category, email, phone, address,
  status)` + `supplier_contacts(supplier_id, ...)` + `supplier_orders` (voir R4-13) ;
  historique = requêtes jointes, jamais de chiffre inventé.

## R4-12 → R4-15 — Achats / devis (Prompt 2)
- R4-12 Purchases : `purchase_requests(reference UNIQUE, requester_profile_id
  (=auth.uid() forcé), direction, project_id, justification, currency, status)` +
  `purchase_lines(request_id, label, qty, unit_price)` ; montants saisis, jamais calculés serveur sans règle.
- R4-13 Purchase orders : `purchase_orders(id, request_id UNIQUE, supplier_id,
  total, status, ordered_at, delivered_at, closed_at)` ; transitions validées
  (`draft→…→closed`, `rejected` terminal partiel).
- R4-14 Quotes : `quotes` + `quote_items` existent — ajouter `valid_until`,
  `conditions`, `discount_usd`, `accepted_by/at`, `viewed_at` ; références
  non séquentielles (anti-énumération).
- R4-15 Quote items : exploiter `quote_items` (lignes, remises, taxes configurables,
  jamais de TVA automatique) ; totaux recalculés serveur (RPC) avant validation.

## R4-16 → R4-23 — ERP / finance / trésorerie (Prompt 2)
- R4-16 Transactions : `erp_transactions` existe + trigger 011 ; ajouter
  `reversed_by` (lien contrepassation) ; catégories `avance/remboursement/
  transfert/ajustement` au CHECK.
- R4-17 Validation : RPC `erp_validate(tx_id, otp, validator)` : vérifie OTP
  serveur, séparation initiateur/manager/DAF, verrouille `valide` ; jamais client.
- R4-18 Reversal : RPC `erp_reverse(tx_id, motif)` créant la contre-écriture
  liée (`reversed_by`) ; suppressions interdites (trigger existant).
- R4-19 OHADA : `ohada_accounts(code PK, label, classe, type)` seed officiel +
  `journal_entries(tx_id, account_code FK, debit, credit, CHECK debit>=0)` ;
  balance/grand-livre = vues.
- R4-20 Journals : `journals(code PK, label)` ; toute écriture liée à un journal.
- R4-21 Entries : voir R4-19 ; partie double vérifiée par contrainte
  (`SUM(debit)=SUM(credit)` par transaction, fonction de validation).
- R4-22 Treasury : `treasury_balances(account, currency, balance, as_of)` calculés
  + `opening_balances(account, currency, amount, set_by, set_at)` (jamais de
  constante codée) ; rapprochement : `reconciliations`.
- R4-23 Cash closures : `cash_closures` existe — ajouter `validated_by/at`,
  workflow OPEN→…→CLOSED en statuts, `theoretical` calculé serveur (jamais constante).

## R4-24 → R4-26 — Workflows / notifications (Prompt 2)
- R4-24 Execution : voir R2-02 + `workflow_links(module, entity, entity_id,
  instance_id)` générique ; presets par module (devis, achat, transaction,
  clôture, ticket, projet, CMS).
- R4-25 Notifications : `notifications(id, owner_profile_id NOT NULL, catégorie,
  titre, lien, priorité, read_at)` — écriture serveur/Edge uniquement ;
  canaux : `notification_deliveries(notification_id, canal, status)` (email/SMS/
  push/WhatsApp déconnectés jusqu'au branchement ; in-app = lecture directe).
- R4-26 Preferences : `notification_preferences(profile_id PK, categories JSONB,
  canaux JSONB)` ; défaut opt-in in-app.

## R4-27 → R4-30 — Audit / offline / sync (Prompt 2)
- R4-27 Audit : `audit_logs` existe — ajouter `before/after JSONB` ; index
  (actor, resource, date) ; rétention + export (lecture `audit.view`).
- R4-28 Queue : `sync_queue` serveur miroir ou contrat d'opération
  (`operationId UNIQUE`, entity, entityId, op, timestamp, actor, payload,
  status, retryCount, error) ; idempotence par `operationId`.
- R4-29 Sync : protocoleui : ordre FIFO par entité, retry exponentiel, resync
  complet sur `version` serveur ; Edge `sync-push` authentifié (remplace
  `/api/sync/push`).
- R4-30 Conflits : stratégie par entité (serveur-gagne défaut ; explicite pour
  devis/transactions : rejet + revue humaine) ; journal des conflits.

## R4-31 → R4-35 — Gemini / sécurité / organisation (Prompt 2)
- R4-31 Actions IA : `ai_actions(id, requester, kind, payload, status, decided_by,
  decided_at)` — proposition stockée, jamais d'exécution directe.
- R4-32 Autorisation IA : Edge vérifie `has_permission` du demandeur sur chaque
  action proposée ; périmètres SUPER_ADMIN > staff > client > visitor.
- R4-33 Audit IA : toute proposition/décision/exécution dans `audit_logs`
  (`resource='ai'`) ; prompts journalisés sans PII.
- R4-34 Security events : `security_events(id, kind, actor, detail, level,
  created_at)` alimenté serveur (logins, refus, escalades tentées) ; lecture
  restreinte (`audit.view`) ; le centre actuel lit l'audit réel en attendant.
- R4-35 Assignments org : voir R2-07 + `project_members` (R4-03) ; toute opération
  porte `profile_id + rôle + direction` (traçabilité RBAC+org+audit).

## R2-11 → R2-23 — CMS / pages / médias / SEO (Prompt 1)
- R2-11 CMS : statuts `review` (CHECK à étendre), `order`, `scheduled_at`.
- R2-12 Pages : `pages(slug UNIQUE, title, is_published, position)`.
- R2-13 Sections : `cms_sections.page_id FK pages(id)` + `position`.
- R2-14 Versions : `cms_versions` existe — ajouter `diff_summary`, `restored_from`.
- R2-15 Publication : `published_by`, contrainte (published ⇒ published_* NOT NULL).
- R2-16 Media : `media_items` + colonne `metadata JSONB` (caption, projet, date réal.).
- R2-17 Gallery : `albums(id, title, cover_media_id)` + `album_items`.
- R2-18 Realizations : `realizations` (client autorisé seul, montants jamais publics sans flag).
- R2-19 YouTube : `youtube_videos` existe — ajouter `synced_at`, `view_count` (lecture seule API).
- R2-20 SEO : `seo_meta(section_id UNIQUE, meta_title, meta_desc, slug, og_image, noindex)` + injection `<head>` au branchement.
- R2-21 Editorial permissions : `cms.publish`/`cms.delete` distincts par page (matrice).
- R2-22 Editorial audit : `CMS_*` via `audit_logs` (déjà en place Wave 2).
- R2-23 Public preview : aucun stockage (rendu isolé existant).
- RLS : lecture publique = `published` seul ; écriture `cms.publish`. Audit : versions + audit.

## R3-01 → R3-15 — Client portal + CRM (Prompt 1)
- R3-01 Portal : `profiles` + vue `v_client_dashboard` (compteurs owner-scopés).
- R3-02 Demandes : `client_requests(id, owner, reference UNIQUE, objet, service, description, status, priority, created_at)` + pièces `request_attachments` (Storage `quotes`).
- R3-03 Tickets : `tickets(reference UNIQUE, owner, sujet, catégorie, priorité, statut, created_at)` + `ticket_messages(ticket, author, body, created_at)` ; pièces Storage.
- R3-04 Notifications : `notifications(id, owner, catégorie, titre, lien, priorité, read_at)` — écrites serveur uniquement (jamais insert client direct).
- R3-05 Documents : `client_documents(id, owner, quote_id?, type[devis,contrat,facture,rapport], storage_path, created_at)` ; Storage privé + signed URLs courtes.
- R3-06 Médias client : `visibility='client'` + table de partage `media_shares(media_id, client_profile_id)` ; jamais de listing global.
- R3-07/08 Accès projets/devis : `submitted_by/owner/lead = auth.uid()` OU permission staff `*.manage` (déjà appliqué 009) ; projeter sur `client_requests`/`tickets` : colonne `owner_profile_id NOT NULL`.
- R3-09 Prospects : `clients.category='prospect'` + `pipeline_stage` (ou table `prospects` si funnel distinct — à trancher Phase DB).
- R3-10 Clients : `clients` existe — ajouter `owner_profile_id` exploité + `fidelity_tier` calculé (vue, pas de chiffre inventé).
- R3-11 Contacts : `contacts(id, client_id FK cascade, name, role, email, phone, notes)` ; RLS via client owner/staff.
- R3-12 Interactions : `crm_interactions(id, client_id FK, author_profile_id (=auth.uid() forcé), type, summary, next_action, due_at)`.
- R3-13 Timeline : vue `v_client_timeline` (UNION interactions/devis/projets/tickets/notifications, `source` labellisée) + RLS owner.
- R3-14 Ownership : toute ligne client/prospect/quote/project/ticket/notification porte `owner_profile_id` ; trigger : à l'INSERT, `owner = auth.uid()` si NULL ; tests A↔B obligatoires.
- R3-15 Relations : FK `contacts→clients`, `interactions→clients`, `quotes→clients/projects`, `tickets→clients`, `documents→quotes`, `notifications→owner` ; suppressions RESTRICT sauf audit (jamais supprimé).
- RLS commune : owner OU permission `*.manage` staff ; anon : inserts `quotes`/`form_submissions`/`tickets(public?)` + rate-limit Edge. Audit : toutes mutations via `audit_logs`.
- Risques : énumération des références (prévoir références non séquentielles), PII (minimiser, chiffrer téléphones si exigé), pièces jointes (MIME + taille + antivirus), notifications (jamais de contenu sensible en clair).
