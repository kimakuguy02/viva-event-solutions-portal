# Migration legacy — VIVA EVENT SOLUTIONS

> `IndexedDB` reste autorisé comme cache/offline (RULE-012). Tout le reste
> migre vers Supabase puis est retiré après validation.

| Legacy | Utilisation | Cible | Migration | Suppression prévue |
|---|---|---|---|---|
| Firebase Auth | Sessions runtime | Supabase Auth | Phase 2 (`AuthContext`) | Phase 10 (cutover) |
| Firestore collections | Persistance runtime (`ProjectData`, `EnterpriseErp`) | PostgreSQL + RLS | Phases 3-5 (contextes) | Phase 10 |
| Firebase Storage | Fichiers (`storageService`) | Supabase Storage (006) | Phase 6 (médias) | Phase 10 |
| Express Auth (HMAC) | Login fallback, sessions | Supabase Auth | Phase 2 (supprimer fallback) | Phase 10 |
| Express `sync/push` | Sync offline→JSON | Supabase upsert + Edge | Phase 8 | Phase 10 |
| Express CRUD (`cms/menus/settings/users`) | Admin prototype | Supabase direct + RPC | Phases 3-4 | Phase 10 |
| `data/viva_database.json` | Base Express | Seeds PG institutionnels | Phase 3 (seeds), lecture seule ensuite | Phase 10 |
| `localStorage viva_*` | SSOT de fait (profils, CMS, ERP, audit) | Cache + préférences | Phases 3-5 (sources), 8 (queue) | Jamais (usage restreint) |
| IndexedDB (`viva_sync_engine_db`, `viva_enterprise_erp_db`) | Cache + queue offline | Inchangé d'usage, rebranché Supabase | Phase 8 | Jamais (rôle conservé) |
| `firestore.rules` / `storage.rules` | Sécurité runtime | RLS + Storage policies | Actives jusqu'au cutover, resserrer si besoin | Phase 10 |
| `server/migrateToFirestore.ts` | Seed Firestore | Seeds PG 003/007 | Remplacé | Phase 3 |

Interdictions immédiates : aucune nouvelle collection Firestore, aucune
nouvelle donnée métier vers Express/JSON/localStorage, aucun nouveau bypass.
