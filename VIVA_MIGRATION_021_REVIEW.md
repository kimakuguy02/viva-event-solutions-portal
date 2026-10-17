# REVIEW — Migration 021 (vague D : workflows/IA/sync/audit/org)
> Non appliquée. Additive, idempotente.

- Tables : `workflows/steps/instances/transitions/links`, `form_workflows`,
  `ai_actions`, `security_events`, `sync_operations`, `org_memberships`,
  `org_unit_modules` (11) ; colonnes `audit_logs.before/after`.
- RLS : définitions lisibles (`forms.view`) ; instances créables (`forms.view`),
  transitions en lecture (moteur Edge) ; IA : demandeur + `audit.view` ;
  sécurité : `audit.view` ; sync : acteur + `erp.view` ; org : view/manage.
- Points d'attention : `ai_insert WITH CHECK(true)` — toute session peut
  proposer (voulu : file d'attente Edge, jamais d'exécution directe) ;
  `sync_insert` idem (contrat idempotent par `operationId` UNIQUE) ;
  `workflow_instances` sans UPDATE/DELETE publics (moteur Edge).
- `security_invoker` non requis ici (pas de vue). Retour arrière : DROP ordre
  inverse + DROP colonnes audit.
