# REVIEW — Migration 019 (vague C1 : projets/ERP étendus)
> Non appliquée. Additive, idempotente (`IF NOT EXISTS`, PK composites).

- Tables : `project_members/milestones/deliverables`, `equipment`,
  `equipment_assignments`, `maintenance_logs`, `suppliers`, `supplier_contacts`,
  `purchase_requests/lines/orders` (11). Colonnes : `projects(+priority/
  archived/description)`, `quotes(+valid_until/conditions/accepted_by/at/viewed_at)`,
  CHECK `erp_tasks.status` reconstruit (+`bloquee/annulee`, nom auto-004).
- Contraintes : PK/FK/UNIQUE/CHECK vérifiées contre 004 (noms auto recalculés) ;
  `purchase_orders.request_id UNIQUE` (1 commande/demande) ; qty/montants >= 0.
- Index : membres/projet, jalons/projet+date, assignations/projet, demandes/demandeur.
- RLS : deny-by-default ; lectures owner-or-staff ; écritures par permission
  (`projects.manage/create`, `equipment.manage`, `erp.create/validate`) ;
  `purchase_orders` : lecture seule (Edge/RPC) ; aucune écriture anon.
- Risques : `erp_tasks_status_check` — si distant divergent, adapter le nom ;
  `purchase_orders` sans insert public (voulu) ; `equipment.code` TEXT PK (stable).
- Rollback : DROP tables ordre inverse + DROP colonnes + restore CHECK 004.
