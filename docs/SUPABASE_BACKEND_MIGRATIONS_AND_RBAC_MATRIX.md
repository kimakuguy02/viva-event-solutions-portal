# RÉFÉRENTIEL DES MIGRATIONS SUPABASE & MATRICE RBAC — VIVA EVENTS
> Projet : Viva Event Solutions
> Référence Supabase cible confirmée : **`bdldjeyrfbgpzxtelmbp`** (attestée dans `VIVA_CURRENT_STATE_FINAL_AUDIT.md` et `VIVA_MIGRATION_A_POSTCHECK.md`).
> Aucune supposition de référence : base vérifiée en lecture via clé anon et rapports formels.

---

## 1. MATRICE DES 9 RÔLES CANONIQUES DE LA PLATEFORME

Définis dans `supabase/migrations/20261003_001_rbac.sql` et alimentés dans `20261003_003_seed_rbac.sql` :

| Code Rôle | Intitulé officiel | Périmètre & Habilitations |
|---|---|---|
| `SUPER_ADMIN` | Super Administrateur | Contrôle global technique et plateforme (sécurité, labo, bypass non métier). |
| `ADMIN_GENERAL` | Direction Générale (Admin Général) | Pilotage global métier, validation stratégique, gouvernance multi-pôles. |
| `DG_GERANT` | DG / Gérance statutaire | Arbitrages budgétaires, investissements, validation des opérations majeures. |
| `ADMIN_RH` | Administrateur RH | Gestion RH, organigramme, fiches postes, gestion des collaborateurs. |
| `DAF_COMPTABLE` | DAF / Comptable SYSCOHADA | Caisse, comptabilité, double signature financière, validation clôtures. |
| `CHEF_EQUIPE` | Chef d'équipe / Régie | Projets terrain, affectation matériels, suivi des jalons opérationnels. |
| `COMMERCIAL_SECRETAIRE` | Commercial / Secrétariat | CRM, création et négociation des devis, suivi des requêtes clients. |
| `CLIENT` | Client Partenaire | Espace client dédié, consultation devis/projets personnels, tickets. |
| `VISITOR` | Visiteur Public | Accès vitrine publique, simulation devis en ligne (anonyme). |

---

## 2. INVENTAIRE DES 33 MIGRATIONS SQL DU DÉPÔT

| N° | Fichier SQL | Objets concernés | Type & Sécurité RLS | Fonctions RPC / Triggers |
|---|---|---|---|---|
| **001** | `20261003_001_rbac.sql` | `roles`, `permissions`, `profiles`, `role_permissions` | Schéma RBAC de base | `set_updated_at()` |
| **002** | `20261003_002_rls.sql` | `profiles`, `roles`, `permissions` | Activation RLS, fonctions auth | `current_role_code()`, `has_permission()`, `is_super_admin()`, `prevent_privilege_escalation()`, `handle_new_user()` |
| **003** | `20261003_003_seed_rbac.sql` | `roles`, `permissions`, `role_permissions` | Seed des 9 rôles et permissions | Idempotent sur conflit |
| **004** | `20261004_004_business_schema.sql` | `clients`, `projects`, `quotes`, `quote_items`, `erp_tasks`, `erp_transactions`, `cash_closures`, `audit_logs`, `cms_sections`, `menus`, `modules`, `forms`, `media_items` | Schéma métier complet | Tables métier fondamentales |
| **005** | `20261004_005_business_rls.sql` | Tables de 004 | Politiques RLS strictes deny-by-default | `prevent_validated_tx_mutation()`, `prevent_audit_mutation()` |
| **006** | `20261004_006_storage.sql` | Buckets Storage (`media`, `erp`, etc.) | RLS sur Storage objects | Contrôle d'accès documents |
| **007** | `20261004_007_business_seed.sql` | Données initiales organisation | Seed directions sans PII | Initialisation métier |
| **008** | `20261004_008_grants.sql` | Schéma public | Sécurisation GRANT public / anon | Révocation des accès non autorisés |
| **009** | `20261004_009_isolation_fix.sql` | `profiles` | Cloisonnement des lectures profils | RLS stricte sur les profils |
| **010** | `20261004_010_audit_actor.sql` | `audit_logs` | Imposition serveur de l'auteur | Trigger `force_audit_actor()` |
| **011** | `20261004_011_erp_guards.sql` | `erp_transactions` | Garde-fous statut initial transaction | Trigger `enforce_tx_initial_status()` |
| **012** | `20261006_012_roles_extend.sql` | `roles` | Extension des permissions transverses | RLS |
| **013** | `20261006_013_feature_flags.sql` | `feature_flags` | Table des drapeaux applicatifs | Flags visibles anon (actifs seulement) |
| **014** | `20261006_014_cms_pages_seo.sql` | `pages`, `seo_meta` | Pages dynamiques et métadonnées SEO | RLS lecture publique |
| **015** | `20261006_015_platform_rich.sql` | `menus`, `modules`, `menu_permissions`, `module_dependencies` | Modèle de navigation dynamique | RLS RBAC |
| **016** | `20261007_016_b_crm_portal.sql` | `contacts`, `crm_interactions`, `client_requests`, `tickets` | CRM et portail client étendu | Trigger `force_owner_author()` |
| **017** | `20261007_017_b_rls_storage.sql` | `notifications`, bucket `client_docs` | RLS notifications et pièces jointes | `lock_notification_update()` |
| **018** | `20261007_018_finance_rpc.sql` | Séquence `viva_ref_seq`, `erp_transactions` | Fonctions RPC financières sécurisées | `reference_mint()`, `erp_approve_manager()`, `erp_validate_daf()`, `erp_reverse_tx()`, `closure_validate()` |
| **019** | `20261007_019_c_projects_erp.sql` | `projects`, `equipment`, `purchases` | Priorités projets, dotations matérielles | RLS |
| **020** | `20261007_020_c_finance_ohada.sql` | `journals`, `accounts_plan` | Plan comptable SYSCOHADA | RLS et intégrité comptable |
| **021** | `20261007_021_d_workflows_system.sql` | `workflows`, `workflow_runs` | Moteur d'étapes opérationnelles | RLS |
| **022** | `20261018_022_org_units_pii.sql` | `org_units` | Masquage des coordonnées et PII | Vue sans PII pour utilisateurs non autorisés |
| **023** | `20261020_023_closure_create_rpc.sql` | `cash_closures` | Calcul serveur de caisse | `closure_create()`, `closure_validate()` |
| **024** | `20261024_024_crm_permissions_and_authors.sql` | `crm_interactions` | Permissions CRM et auteur automatique | `set_crm_interaction_author_label()` |
| **025** | `20261024_025_welcome_copy_societe.sql` | `cms_sections` | Mise à jour textuelle officielle | Update ciblé |
| **026** | `20261024_026_finance_server_authority.sql` | `erp_transactions` | Autorité serveur seuil double signature | `erp_double_signature_required()`, `enforce_tx_initial_status()` |
| **027** | `20261024_027_closure_conformity.sql` | `cash_closures`, `opening_balances` | Conformité clôture et solde d'ouverture | `opening_balance_set()`, `closure_create()`, `closure_validate()` |
| **028** | `20261024_028_anon_privilege_lockdown.sql` | Tout schéma public | Révocation des privilèges hérités anon | Neutralisation des permissions par défaut |
| **029** | `20261024_029_view_privilege_lockdown.sql` | Vues SQL | Verrouillage privilèges sur les vues | Révocation écriture sur vues publiques |
| **030** | `20261024_030_sequence_lockdown.sql` | `viva_ref_seq` | Verrouillage accès séquence pour anon | Révocation USAGE anon sur séquence |
| **031** | `20261025_031_submit_quote_rpc.sql` | `quotes` | Génération référence devis serveur | `submit_quote()` SECURITY DEFINER |
| **032** | `20261025_032_quote_audit_and_no_mirror.sql` | `quotes`, `audit_logs` | Audit serveur direct lors soumission | `submit_quote()` avec audit log automatique |
| **033** | `20261025_033_quotes_insert_lockdown.sql` | `quotes` | Révocation de tout INSERT direct anon | Forçage exclusif de la RPC `submit_quote` |

---

## 3. ÉTAT RÉEL D'APPLICATION SUR LE PROJET DISTANT (`bdldjeyrfbgpzxtelmbp`)

- **Vérifiées appliquées (preuves en lecture)** :
  - Migrations 001 à 015 : Confirmées lors des audits Phase 1 & Vague A (tables lisibles en 200, politiques anon effectives, tables `feature_flags`, `pages`, `seo_meta`, etc. en place).
- **En attente d'application ou d'exécution finale sous rôle Postgres / Admin** :
  - Migrations 016 à 033 : Définies localement dans le dépôt avec tous leurs scripts de verrouillage et de calcul serveur. L'application en production nécessite d'exécuter la suite SQL via l'interface Supabase SQL Editor ou le CLI Supabase lié au projet `bdldjeyrfbgpzxtelmbp`.
