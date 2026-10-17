# VIVA PHASE 2.2 — TESTS DATA CORE
> Suite : `scripts/datacore-check.mjs [--live]`. Résultat du jour : 4 PASS
> statiques + 9 PASS live (tables B/C/D absentes = attendu, domaines migrés
> conformes, A/B devis refusé anon) + 0 FAIL. 0 SKIP en live.

## Couverture
- DC-01 file offline (operationId/retry) : PASS statique.
- DC-02 annuaire DB + mention : PASS statique.
- DC-03 mentions session (tickets/notifications/contacts) : PASS statique.
- DC-04 miroirs marqués (30) : PASS statique.
- DC-NEW-* : PASS (PGRST205 = non déployées, cohérent).
- DC-READ flags/menus : PASS. DC-AB quotes anon : PASS (42501).
- Sessions CLIENT/ADMIN/DAF, RLS par rôle sur nouvelles tables, persistance
  reload/login, A/B sur B/C : NON TESTABLE (tables non déployées, sessions
  requises) — à rejouer post-application via T-A1→A13 étendus + FIN-03→10.

## Non-régression
`tsc` PASS (1 erreur introduite corrigée : cast rôles[]). `build` PASS.
Parcours existants intacts (aucune route/logique supprimée).
