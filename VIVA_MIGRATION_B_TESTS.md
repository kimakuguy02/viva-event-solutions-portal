# VIVA — TESTS VAGUE B (post-application 016→017, comptes jetables `*-test.cd`)
> Comptes + lignes de test supprimés après campagne. Ne jamais simuler un PASS.

## B-T1 structure
```sql
select table_name from information_schema.tables where table_schema='public'
and table_name in ('contacts','crm_interactions','client_requests','request_attachments','tickets','ticket_messages','client_documents','notifications','notification_deliveries','notification_preferences') order by table_name;
-- attendu : 10 lignes
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('contacts','crm_interactions','client_requests','request_attachments','tickets','ticket_messages','client_documents','notifications','notification_deliveries','notification_preferences') order by tablename;
-- attendu : 10 lignes, rowsecurity=true partout
select * from storage.buckets where id='client_docs'; -- attendu : 1 ligne, public=false
```

## B-T2 RLS (sessions A/B + staff, jamais owner SQL pour les assertions)
- anon : `select` chaque table B → 0 ligne ou 42501 ; `insert` → refusé.
- CLIENT A : `select contacts` → vide (pas son client) ; après rattachement
  (owner de `clients` = A via SQL owner) : visible.
- `insert into tickets (reference, sujet)` sans owner → owner forcé = A
  (relire : `owner_profile_id` = uid A).
- `update notifications set titre='x'` (own) → erreur trigger ; `read_at` → OK.

## B-T3 isolation A/B
- 2 tickets (A, B) + 2 demandes + 2 messages croisés : A lit 1+1, B lit 1+1 ;
  lecture croisée directe par id → 0 ligne.

## B-T4 ownership
- `insert ... owner_profile_id=<autre>` → stocké = soi (trigger) ;
  `request_attachments` sur demande d'autrui → refusé.

## B-T5 documents privés
- Fichier bucket `client_docs` uploadé par A : lecture A OK ; lecture B
  (sans `erp.view`) → refusée ; lecture staff `erp.view` → OK.

## B-T6 tickets
- Cycle OPEN→RESOLVED par owner OK ; `delete from tickets` par owner → refusé.

## B-T7 notifications
- Insert client direct → refusé ; insert Edge/owner → OK ; update `titre`
  par owner → erreur trigger ; update `read_at` → OK.

## B-T8 idempotence
- Réappliquer 016→017 → 0 doublon (IF NOT EXISTS / DROP IF EXISTS) ;
  `insert ... on conflict` n/a (pas de seed).

## B-T9 non-régression A + 25 tables
- Rejouer TEST 2/3 (devis, escalade) ; `app_settings.features.defaults`
  intact ; T-A1 structure sur objets A (inchangés).
- Nettoyage : `delete` ciblé des lignes `__t*`/jetables + `auth.users` test.
