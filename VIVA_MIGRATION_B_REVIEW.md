# VIVA — REVUE VAGUE B (génération contrôlée, non appliquée)
> 2 fichiers : `20261007_016_b_crm_portal.sql`, `20261007_017_b_rls_storage.sql`.
> Aucune exécution distante, aucune donnée touchée, aucun applicatif modifié.

## Objets créés
- 016 : fonction `force_owner_author(arg)` + 8 tables (`contacts`,
  `crm_interactions` + trigger auteur, `client_requests` + trigger owner,
  `request_attachments`, `tickets` + trigger owner, `ticket_messages` +
  trigger auteur, `client_documents`) + 5 index.
- 017 : `notifications` + trigger verrou `lock_notification_update`,
  `notification_deliveries`, `notification_preferences` + trigger updated_at,
  16 policies, GRANTs (+ `ALTER DEFAULT PRIVILEGES`), vue `v_client_timeline`
  (`security_invoker=true`), bucket `client_docs` privé + 3 policies Storage.

## Objets modifiés : AUCUN
- Pas de DROP/ALTER sur tables existantes ; pas de CHECK reconstruit ;
  pas de policy existante touchée ; `storage.buckets` : INSERT seul.

## Dépendances
016→(001, 004) · 017→(001, 002, 004, 016). Ordre : 016 puis 017.
`v_client_timeline` dépend de `quotes/clients/requests/tickets` existantes.
`security_invoker` exige PG ≥15 (Supabase : OK ; sinon échec visible, sans danger).

## Règles produit vérifiées (statique)
1. Pas de doublon 25 tables ✓ (noms nouveaux).
2. UUID partout ✓ ; références métier (`reference`) UNIQUE sans default
   séquentiel — génération côté Edge/RPC (C), documenté.
3. A↔B : owner forcé par trigger + policies owner-ou-staff ; anon : zéro accès ✓.
4. Documents privés : bucket privé + lecture owner-ou-staff (objet `owner`) ✓.
5. Pièces : bucket `client_docs` + FK cascade ✓.
6. Tickets/demandes : `owner NOT NULL` + trigger + `ON DELETE RESTRICT`
   profil (pas d'orphelin silencieux) ✓.
7. Notifications : ciblées (owner ; rôle/direction = Edge futur, colonnes
   prévues via `categorie`+`lien`) ✓.
8. Anon : aucune policy `TO anon` dans B ✓.
9. Pas de rôle supplémentaire ✓ ; pas de `user_permissions` ✓ ; pas de TVA ✓.
10. Audit : mutations via `audit_logs` existant (Edge/serveur à brancher ;
    triggers B journalisables) ; `notification_deliveries` traçable ✓.
11. Idempotence : `IF NOT EXISTS`, `ON CONFLICT` n/a (pas de seed), policies
    `DROP IF EXISTS` ✓.
12. Pas de suppression destructive (aucun DELETE/UPDATE policy de destruction ;
    suppressions = Edge) ✓.

## Risques
- R-B1 : `v_client_timeline` sans `security_invoker` supporté (PG<15) →
  échec visible à l'apply, sans danger ; vérifier version au staging.
- R-B2 : `reference` sans default → inserts sans référence échouent ;
  correct (oblige la génération serveur), documenté.
- R-B3 : notifications `UPDATE` owner + trigger verrou : cohérents ;
  `read_at` seule mutation possible.
- R-B4 : `tickets_update` owner peut modifier ses champs (dont statut) —
  acceptable (propre ticket éditable) ; transitions sensibles = Edge futur.
- R-B5 : `requests_update` owner limité à `DRAFT` ✓ ; staff `erp.update`.
