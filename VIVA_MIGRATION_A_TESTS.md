# VIVA — TESTS VAGUE A (à exécuter après application 012→015, dans l'ordre)
> Comptes jetables `*-test.cd` pour tout test authentifié ; nettoyage final.
> Ne jamais tester en `postgres`/owner pour valider RLS (bypass).

## T-A1 — structure (après chaque fichier)
```sql
-- 012
select column_name from information_schema.columns
where table_schema='public' and table_name='roles' and column_name in ('is_custom','position');
-- attendu : 2 lignes
-- 013
select code, is_enabled, env from public.feature_flags order by code;
-- attendu : 7 lignes (si seed 007 présent ; sinon 0 = condition C-01)
-- 014
select column_name from information_schema.columns
where table_schema='public' and table_name='cms_sections'
and column_name in ('page_id','position','scheduled_at','published_by');
-- attendu : 4 lignes
-- 015
select count(*) from information_schema.tables
where table_schema='public' and table_name in ('menu_permissions','module_dependencies');
-- attendu : 2
```

## T-A2 — RLS des nouveaux objets
```sql
select tablename from pg_tables where schemaname='public'
and tablename in ('pages','seo_meta','feature_flags','menu_permissions','module_dependencies')
and rowsecurity = true;
-- attendu : 5 lignes
```
Puis en session CLIENT : `select * from pages` → 0 ligne (sauf publiées après
insert) ; `insert into feature_flags ...` → erreur ; `insert into
menu_permissions ...` → erreur.

## T-A3 — cycle de vie sans régression (compte staff `cms.update`)
1. `insert into pages(slug,title,is_published) values ('__t','Test',false)`
   → succès ; anon `select` → 0 ligne.
2. `insert into cms_sections(page,text...)` statut `review` → succès
   (prouve le CHECK étendu) ; anon → 0 ligne.
3. `insert into seo_meta(section_id,...)` → succès.
4. Nettoyage ciblé : `delete from seo_meta where ...; delete from
   cms_sections where content_key='__t..'; delete from pages where slug='__t';`
   → succès (policies DELETE staff existantes).
5. Ancien CHECK intact : insert statut `nimportequoi` → erreur contrainte.

## T-A4 — non-régression existant
- Rejouer TEST 2/3 (isolation devis, anti-escalade) : inchangés.
- `select * from app_settings where key='features.defaults'` : ligne source intacte.
- `tsc` + `build` : non concernés (aucun applicatif modifié) — à refaire quand
  l'app consommera les nouveaux objets.
