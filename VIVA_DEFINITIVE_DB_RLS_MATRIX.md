# VIVA DEFINITIVE DB — MATRICE RLS CIBLE
> Par table : RLS ON partout, deny-by-default. `S`=SELECT, `I`=INSERT, `U`=UPDATE,
> `D`=DELETE. `self` = owner (`owner/submitted_by/lead/assigned/actor = auth.uid()`).
> Staff = permission `*.manage` (jamais `*.view` pour le croisé). RPC = écriture
> serveur seule. ANON : inserts `quotes/form_submissions/tickets/requests` + lectures
> `*_public_read` + rate-limit Edge.

| Table | ANON | CLIENT | STAFF (rôle concerné) | SUPER_ADMIN |
|---|---|---|---|---|
| roles/permissions/role_permissions | — | — | S si `roles.view` | S (+ écriture via Edge `permissions.assign`) |
| profiles | — | S+U self (hors rôle/statut, trigger) | S si `users.view`, U si `users.update` | S/U via Edge |
| org_units/memberships | S si `is_active` | S si `is_active` | S + écriture si `organization.manage` | S + Edge |
| menus | S si actif+public | S + staff selon `menus.view` | écriture si `menus.manage` | S + Edge |
| modules(+perims) | S si actif non-archivé | S | écriture si `modules.create/update` | S + Edge |
| forms/fields | S si actif+public | S | écriture si `forms.create/update` | S + Edge |
| form_submissions | I | I + S self | S si `forms.manage` | S + Edge |
| cms_sections/versions | S si `published` | S publié | écriture si `cms.update/publish` | S + Edge |
| pages/seo_meta | S si publié | S publié | écriture si `cms.update` | S + Edge |
| media_items/youtube | S si publié+public | S public | écriture si `media.upload/manage` | S + Edge |
| clients/contacts/interactions | — | S self (owner) | écriture si `erp.create`, lecture si `erp.view` | S + Edge |
| requests/tickets (+messages/enfants) | I (requests/tickets) | I + S self | S + traitement si `forms.manage`/staff | S + Edge |
| notifications | — | S self, U `read_at` self | — (émission serveur) | S + Edge |
| documents | — | S self (signed URLs courtes) | S si `quotes.view`+lien | S + Edge |
| projects/members/milestones/deliverables | — | S self (lead/owner) | S/U si `projects.manage` | S + Edge |
| quotes/items | I | I + S self | S/U si `quotes.manage`, approve si `quotes.approve` | S + Edge |
| equipment/assignments/maintenance | — | — | S si `erp.view`, écriture si `equipment.manage` | S + Edge |
| suppliers/contacts/orders/purchases | — | — | S si `erp.view`, écriture si `erp.create`, validation via RPC | S + Edge |
| erp_transactions | — | — | S si `erp.view`, I si `erp.create` (trigger 011 force statut), U/D : RPC seul | S + RPC |
| ohada/journals/entries/treasury | — | — | S si `erp.view`, écritures via RPC | S + RPC |
| cash_closures | — | — | écriture si `erp.validate` | S + Edge |
| workflows/instances/transitions/links | — | S instances self | définition si `forms.create`+ staff, exécution via moteur | S + Edge |
| notifications prefs | — | S+U self | — | S |
| audit_logs | — | I (acteur forcé trigger), S self | S si `audit.view` | S (jamais U/D, trigger) |
| security_events/ai_actions | — | S self (ai) | S si `audit.view` | S + Edge |
| sync_operations | — | S self | S si périmètre | S + Edge |
| app_settings/feature_flags | — | — (lecture publique partielle via Edge) | S si `settings.view`, écriture si `settings.manage` | S + Edge |

## RPC / serveur obligatoire (jamais d'écriture directe navigateur)
`erp_validate`, `erp_reverse`, `ohada_post`, `closure_validate`, `admin_assign_role`,
`sync_push`, `gemini_ask`, `notifications_dispatch`, `ticket_create` (si spam),
`reference_mint` (références non séquentielles). Chaque RPC : vérifie JWT →
`has_permission`/`is_super_admin` → mute → audit. Storage : buckets existants +
`forms` (soumissions) ; signed URLs courtes pour le privé ; validation
type/taille/antivirus côté Edge ; suppression ligne + objet couplées.
