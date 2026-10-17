# VIVA — REVUE VAGUE A (génération contrôlée, non appliquée)
> 4 fichiers : `20261006_012_roles_extend.sql`, `20261006_013_feature_flags.sql`,
> `20261006_014_cms_pages_seo.sql`, `20261006_015_platform_rich.sql`.
> Aucune exécution distante, aucune donnée touchée, aucun applicatif modifié.

## Objets créés
- 012 : 0 table ; 3 colonnes (`roles.is_custom/position`, `permissions.scope`).
- 013 : table `feature_flags` + trigger `trg_feature_flags_updated` + 3 policies
  (public/lecture staff/écriture) + GRANTs + seed par copie depuis
  `app_settings.features.defaults`.
- 014 : tables `pages`, `seo_meta` ; 4 colonnes `cms_sections`
  (`page_id/position/scheduled_at/published_by`) + index ; CHECK `status`
  reconstruit (+`review`) ; 4 policies ; GRANTs.
- 015 : tables `menu_permissions`, `module_dependencies` (+ anti-auto-référence) ;
  4 colonnes `menus`, 3 colonnes `modules`, 4 colonnes `form_fields` + CHECK
  reconstruit (+`module/client/project`), 2 colonnes `media_items` + index ;
  2 policies lecture ; GRANTs.

## Objets modifiés (sans écrasement)
- CHECK `cms_sections_status_check` et `form_fields_field_type_check` :
  DROP IF EXISTS + re-ADD (noms auto-générés 004, vérifiés caractère par caractère).
- Rien d'autre : pas de DROP TABLE, pas de TRUNCATE/DELETE, pas de fonction
  existante touchée, pas de policy existante modifiée.

## Dépendances
012→(001,003) · 013→(001,004 + seed 007 pour la copie) · 014→(001,004) ·
015→(001,004,013). Ordre d'application : 012→013→014→015.

## Conditions non remplies / risques
- C-01 : si la ligne `app_settings.features.defaults` est absente (007 non
  appliqué), 013 insère 0 flag — sûr mais incomplet. Vérifier via test T-013b.
- C-02 : colonnes supposées absentes (vérifié : 004 ne les définit pas).
  Si un déploiement divergent les contient déjà avec un autre type,
  `ADD COLUMN IF NOT EXISTS` ne normalise pas → vérifier types avant apply.
- C-03 : `service_role`/owner requis pour DDL (anon insuffisant — déjà prouvé).
- C-04 : staging/PITR toujours non prouvés (cf. Étape 2, O-04).
- Risque résiduel : `seo_public_read USING(true)` expose toutes les métadonnées
  (accepté : métadonnées d'affichage ; revalider si contenu sensible ajouté).

## Contrôles statiques effectués (preuves)
- Relecture intégrale de 004 (colonnes existantes) avant écriture : pas de doublon.
- Noms de CHECK auto-générés recalculés depuis le DDL 004 exact.
- FK cibles existantes (`profiles/permissions/feature_flags/menus/modules/
  cms_sections`) ; `storage` non touché.
- Idempotence : `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP ... IF EXISTS`.
- RLS : `ENABLE` sur chaque nouvelle table ; `*_staff_read` alignées sur les
  permissions existantes ; aucune écriture publique.
