# VIVA — VAGUE A — POST-CONTRÔLE AUTOMATIQUE
> Exécuté le 07/10/2026 avec les seuls moyens disponibles (clé anon, lecture
> seule). Aucune écriture, aucune modification, aucune migration. Les limites
> de vérification sont explicites — rien n'est simulé.

## A. Identité projet
- PROJECT REF : `bdldjeyrfbgpzxtelmbp` (dérivé localement de l'URL configurée,
  jamais de clé affichée).
- PROJECT NAME : non vérifiable d'ici (pas d'accès Dashboard).
- ENVIRONMENT IDENTIFIED : l'endpoint configuré — présumé VIVA courant faute
  de référentiel distinct ; distinction staging/prod IMPOSSIBLE d'ici
  (un seul endpoint connu). Toute action DDL reste owner-side.

## B. 5 tables : EXISTENT (toutes lisibles, 0 erreur catalogue)
`feature_flags`, `pages`, `seo_meta`, `menu_permissions`, `module_dependencies`
→ requêtes 200 (plus de PGRST205). Vague A bien appliquée par le propriétaire.

## C. RLS : partiellement prouvée par comportement
- Lectures anon conformes aux policies : flags (6 lignes, voir G),
  `pages`/`seo_meta`/`menu_permissions`/`module_dependencies` → ensembles vides
  (cohérent : rien de publié/inséré).
- Contenu `pg_tables`/`pg_policies` : NON VERIFIABLE d'ici (pas de privilège
  catalogue). Les 5×`true` restent à confirmer en 1 requête owner.

## D. Policies : texte NON VERIFIABLE d'ici
- Comportement observé cohérent (public lit le public, rien d'autre).
- `seo_public_read USING(true)` : 0 ligne exposée à ce stade.
- Vérification du texte exact : requête owner requise (voir §N).

## E. Indexes : NON VERIFIABLES directement
- `cms_sections_page_id_idx`, `media_items_owner_idx` : existence non lisible
  sans catalogue. Requêtes owner fournies §N.

## F. Contraintes : NON VERIFIABLES directement
- Dont `seo_meta_slug_unique` : 0 ligne → vacuité vraie mais présence du
  CHECK non prouvée d'ici. Test owner : insert doublon → erreur attendue.

## G. Feature flags : 6 visibles + 1 AMBIGUÏTÉ À LEVER
- Visibles (anon, enabled+production) : `quotesEnabled, votingEnabled,
  liveHubEnabled, ticketingEnabled, clientPortalEnabled, visitorRadarEnabled`.
- Absent de la vue anon : `maintenanceMode`. Explication la plus probable :
  ligne EXISTANTE avec `is_enabled=false` → masquée par la policy elle-même
  (comportement VOULU, preuve indirecte que RLS s'applique).
- Levée d'ambiguïté (1 requête owner) :
  `select code, is_enabled, env from public.feature_flags order by code;`
  → attendu 7 lignes dont `maintenanceMode/false`. Si 6 lignes totales :
  anomalie réelle de seed (à corriger par INSERT ciblée, jamais de re-seed global).

## H. Doublons slug : 0 ligne (table vide) — vacuité vraie, contrainte à prouver (§F).

## I. 25 historiques : INTACTES
- Signature identique à l'avant-migration (lisibles publiques OK, privées
  refusées 42501, aucune PGRST205 nouvelle) : aucune table disparue, aucune
  collision. Données non comparées ligne à ligne (hors portée anon).

## J. Historique migrations : NON VERIFIABLE d'ici
- Schéma `supabase_migrations` inaccessible en anon. Preuve indirecte :
  objets 012→015 présents et conformes. Confirmation owner : 1 requête
  (`select version from supabase_migrations.schema_migrations order by version`).

## K. Tests A5→A13
- A5 idempotence : NON TESTABLE d'ici (nécessite ré-exécution owner ; à refaire
  + recompter : attendu toujours 7/9/5/4).
- A6 isolation : NON REJOUÉ (comptes jetables supprimés ; exiger recréation
  + TEST 2 complet avant prod).
- A7 9 rôles : NON TESTABLE d'ici (sessions requises).
- A8 public/private : PARTIEL (anon conforme ; authentifié non testé).
- A9 FK : NON TESTABLE en écriture (0 ligne + pas de droit).
- A10 unicité SEO : voir F.
- A11/A12 self/doublon : NON TESTABLE en écriture (contraintes relues OK en statique).
- A13 lifecycle : NON TESTABLE en écriture.

## L. Anomalies
1. (À lever, probablement bénigne) `maintenanceMode` invisible anon — voir G.
2. Aucun défaut prouvé par ailleurs.

## M. Risques restants
- Vérifications catalogue/texte-policies/owner encore dues (1 session SQL owner).
- A6/A7 à rejouer impérativement avant toute exposition (comptes jetables).
- Staging/prod toujours non distingués d'ici ; PITR/backups non prouvés.

## N. Requêtes owner restantes (copier-coller, lecture seule)
```sql
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('feature_flags','pages','seo_meta','menu_permissions','module_dependencies') order by tablename;
select policyname from pg_policies where schemaname='public' and tablename in ('feature_flags','pages','seo_meta','menu_permissions','module_dependencies') order by tablename, policyname;
select code, is_enabled, env from public.feature_flags order by code;
select indexname from pg_indexes where schemaname='public' and indexname in ('cms_sections_page_id_idx','media_items_owner_idx') order by indexname;
select conname from pg_constraint where conrelid in ('public.seo_meta'::regclass,'public.menu_permissions'::regclass,'public.module_dependencies'::regclass,'public.cms_sections'::regclass,'public.form_fields'::regclass) and conname in ('seo_meta_slug_unique','seo_meta_pkey','menu_permissions_pkey','module_dependencies_pkey','module_dependencies_check','cms_sections_status_check','form_fields_field_type_check') order by conname;
```

# VERDICT : A POSTCHECK PARTIEL — NON VALIDÉE DÉFINITIVEMENT
Motif : objets présents et comportements anon conformes (PASS partiel réel),
mais policies/indexes/contraintes non relus, `maintenanceMode` ambigu,
historique migrations non consulté, A6/A7 non rejoués. Prochain pas : les 5 requêtes
§N + recréation comptes jetables pour A6/A7. Vague B non commencée. Rien modifié.

## FINAL CLOSURE (07/10/2026 — moyens anon, lecture seule)

| Contrôle | Résultat | Preuve |
|---|---|---|
| REQ-N1 RLS (`pg_tables`) | NON TESTABLE | HTTP 404 schéma non exposé en anon (pas un échec migration) |
| REQ-N2 policies (`pg_policies`) | NON TESTABLE | idem — texte exact inaccessible sans privilèges |
| REQ-N3 flags complets | NON TESTABLE | 6/7 visibles ; `maintenanceMode` probablement masqué car `false` (RLS voulue), 1 SELECT owner suffit |
| REQ-N4 index/contraintes | NON TESTABLE | catalogues inaccessibles en anon |
| REQ-N5 historique migrations | NON TESTABLE | schéma `supabase_migrations` inaccessible en anon |
| maintenanceMode | NON TESTABLE | voir REQ-N3 |
| A6 isolation | NON TESTABLE | sessions requises ; création sans capacité de suppression = résidu interdit sur projet live |
| A7 9 rôles | NON TESTABLE | idem (9 sessions + nettoyage owner) |
| 5 tables présentes | PASS | lectures 200, plus de PGRST205 |
| Comportements anon | PASS | publics lisibles, privés refusés, 25 historiques intacts |
| 0 écriture effectuée | PASS | aucune mutation émise de ce côté |

### VERDICT
## A PARTIELLE — ACCÈS MANQUANT
Rien de prouvé défectueux ; contrôles critiques réellement non vérifiables
sans accès privilégié. Ni PASS (interdit : contrôles critiques manquants),
ni CORRIGER (aucun défaut prouvé), ni BLOQUÉE (aucun blocage structurel).
Vague B non commencée. En attente : session SQL owner + campagne A6/A7.
