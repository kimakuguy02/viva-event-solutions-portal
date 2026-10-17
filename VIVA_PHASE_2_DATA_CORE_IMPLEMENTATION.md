# VIVA PHASE 2.2 — IMPLÉMENTATION DATA CORE
> Migrations 019/020/021 + revues 019/020/021 générées, non appliquées.
> Frontend : annuaire DB lecture + file offline idempotente. tsc/build verts.

## Migrations créées (locales, en attente owner)
- `20261007_019_c_projects_erp.sql` : 11 tables (members/milestones/
  deliverables, equipment/assignments/maintenance, suppliers/contacts,
  purchases/lines/orders) + colonnes projects/quotes + CHECK tâches étendu.
  RLS owner/staff par permission, GRANTs, commandes sans insert public.
- `20261007_020_c_finance_ohada.sql` : journals/ohada/entries/opening/
  treasury/reconciliations + `validated_by/at` closures ; lecture `erp.view`
  seule, écritures RPC/Edge ; zéro TVA ; pas de fonction fantôme.
- `20261007_021_d_workflows_system.sql` : workflows/steps/instances/
  transitions/links, `form_workflows`, `ai_actions`, `security_events`,
  `sync_operations`, `audit.before/after`, `org_memberships/modules` + RLS.
- Règles communes : ADDITIF, idempotent, 0 suppression, RLS deny-by-default,
  `service_role`/Edge pour le sensible, retours documentés par fichier.

## Frontend
- Annuaire : lecture `profiles+roles` fusionnée par e-mail (DB gagne),
  bannière de source explicite ; écritures toujours locales (Edge à venir).
- Offline : `operationId` stable + `retryCount`/`status` + incrément à l'échec
  (contrat R4-28 côté client ; serveur : vague D).
- Tickets/notifications/contacts : déjà en session labellisée (vérifié) ;
  basculeront sur B à son application (services prêts côté lecture).
- Cutover lectures : aucun changement (familles déjà Supabase-first là où
  tables vérifiées) ; Realtime : contrats documentés, non implémenté (Étape 15).

## Rotation secrets (procédure, non exécutée — sans secret manager)
1. Générer `SESSION_SECRET` (≥32o aléatoires) et `ADMIN_PASSWORD` (≥12c)
   hors repo. 2. Les poser en variables d'environnement d'hébergement
   (jamais commités). 3. Supprimer `data/viva_database*.json` et redémarrer
   (régénération + re-hash). 4. Forcer reconnexion de tous les utilisateurs
   (sessions HMAC invalidées). 5. Révoquer l'ancienne clé Firebase si exposée
   (console Firebase). 6. Confirmer : suite sécurité + login/logout + sync.
