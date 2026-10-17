# VIVA DATA CORE — RAPPORT D'ACTIVATION
> Mission : activer le Data Core existant, avancer vers l'app métier réelle.
> Aucune donnée modifiée/supprimée, aucune migration appliquée d'ici.

## 1. Migrations 016→021 : NON APPLIQUÉES (prouvé, pas supposé)
- Sondes : 32/32 tables B/C/D → `PGRST205` ; 5 RPC → `PGRST202`.
- Cause : droits DDL indisponibles d'ici (anon seule) — pas un échec,
  une borne d'accès documentée depuis l'Étape 3B.
- Fichiers locaux vérifiés présents et ordonnés : 016 (CRM/portail) →
  017 (RLS/notifs/bucket) → 018 (RPC finance) → 019 (projets/ERP) →
  020 (OHADA/trésorerie) → 021 (workflows/IA/sync/audit). 001→015 distants intacts.

## 2. Objets créés (cette mission) : AUCUN requis
- Rien à régénérer : 016→021 + 018 + revues + tests existent et sont relus OK.

## 3. Finance activée : PARTIELLEMENT (chemins prêts, RPC en attente)
- Code : RPC-first + repli legacy explicite + attestation DAF (OTP simulé supprimé).
- Distant : RPC absentes → repli legacy effectif, marqué NON SÉCURISÉ en logs.
- FIN-03→FIN-10 : NON TESTABLES (sessions + 018 requises).

## 4. Tests FIN : auto + anon verts (détail : `finance-check --live`, 0 FAIL).

## 5. Domaines Data Core : états live
- Actifs Supabase-first (vérifiés lisibles) : settings, CMS, menus, modules,
  forms, org, médias, projets, devis, ERP-inserts, clients, flags, pages, seo.
- En attente 016→021 : contacts, tickets, notifications, documents, équipes/
  jalons/livrables (miroir), équipements, achats, OHADA, workflows, sync.
- Tous avec repli labellisé, 0 faux succès (suites vertes).

## 6. Frontend connecté : OUI (dégradation gracieuse prouvée par conception +
  suites). Aucune route cassée par l'absence des tables (try/catch PGRST205).

## 7. Domaines encore legacy : users/rôles écriture, audit admin, transitions
  financières, tickets/votes/live, Storage Firebase, sync Express, mocks/PII
  résiduelles `INITIAL_*`.

## 8. Problèmes rencontrés : AUCUN nouveau (borne DDL déjà documentée).

## 9-10. tsc PASS (0) · build PASS. Reste avant Phase 3 :
1. Owner : appliquer 016→021 dans l'ordre en SQL Editor (sauvegarde préalable).
2. Rejouer : datacore-check + finance-check + TEST 2/3 + FIN-03→10 + A6/A7.
3. Purger PII `INITIAL_*` restantes + rotation secrets + backups/PITR prouvés.
4. Phase 3 : Realtime (contrats prêts), offline robuste (operationId prêt),
   Gemini Edge, E2E, CI/CD, observabilité, staging.

# VERDICT : DATA CORE ACTIVATION PARTIAL
Tout ce qui était activable d'ici l'est (code câblé, vérifié, vert) ;
l'activation serveur (016→021) attend l'opération owner. Prochaine étape
recommandée : Phase 3 UNIQUEMENT après application + re-vérification.
