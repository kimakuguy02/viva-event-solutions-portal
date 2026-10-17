# VIVA — VAGUE A — REVUE TECHNIQUE (3A, read-only)
> 4 fichiers relus intégralement sur disque. Distant interrogé en lecture seule
> uniquement. Rien modifié, rien appliqué, vague B non commencée.

## 1. Inventaire exact

| Migration | Objet | Action | Dépendance | Risque |
|---|---|---|---|---|
| 012 | `roles.is_custom`, `roles.position` | ADD COLUMN IF NOT EXISTS | 001, 003 | FAIBLE (C-02) |
| 012 | `permissions.scope` | ADD COLUMN IF NOT EXISTS | 001 | FAIBLE |
| 013 | `feature_flags` | CREATE TABLE + trigger + 3 policies + GRANTs | 001, 004, seed 007 | MOYEN (C-01 + exposition publique, voir §4) |
| 013 | 7 flags (seed par copie) | INSERT…SELECT ON CONFLICT DO NOTHING | `app_settings.features.defaults` | FAIBLE (C-01) |
| 014 | `pages`, `seo_meta` | CREATE TABLE + trigger(pages) + 4 policies + GRANTs | 001, 004 | FAIBLE |
| 014 | `cms_sections.page_id/position/scheduled_at/published_by` + index | ADD COLUMN IF NOT EXISTS | 004, profiles, pages | FAIBLE |
| 014 | CHECK `status` +`review` | DROP IF EXISTS + re-ADD (nom auto 004 vérifié) | 004 | FAIBLE (nom vérifié caractère par caractère) |
| 015 | `menu_permissions`, `module_dependencies` (+ anti-auto) | CREATE TABLE + 2 policies lecture + GRANTs | 002 (régime), 004 | MOYEN (cycles §7) |
| 015 | `menus`: display_name/module_id/badge/open_in_new_tab | ADD COLUMN IF NOT EXISTS | 004 | FAIBLE |
| 015 | `modules`: visibility/feature_flag→`feature_flags`/menu_id | ADD COLUMN IF NOT EXISTS | 004, 013 | MOYEN (ordre 013 avant 015) |
| 015 | `form_fields`: help_text/validation/section/visible_roles + CHECK +3 types | ADD + CHECK rebuild (nom auto 004 vérifié) | 004 | FAIBLE |
| 015 | `media_items`: metadata JSONB + owner_profile_id + index | ADD COLUMN IF NOT EXISTS | 004 | FAIBLE |

## 2. Compatibilité 25 tables (REMOTE VERIFICATION = PARTIELLE)
- Distant prouvé : 25 tables présentes, RLS/GRANT actifs (comportement), seeds
  003/007, buckets, triggers 002/005/010/011 (fonctionnel).
- Relu à l'instant : les 5 nouveaux objets sont ABSENTS distant (PGRST205 ×5) —
  pré-état correct, aucune application partielle.
- Non relus distant (faute de privilèges) : définitions exactes colonnes/
  contraintes/policies/triggers au-delà du comportement testé. Écrit comme tel,
  jamais supposé.
- Collisions : aucune (noms nouveaux ; colonnes `IF NOT EXISTS` ; CHECK
  rebuildés sur noms auto-004 vérifiés). Types : NULLables ou défaultés →
  lignes existantes sûres. Pas de dépendance circulaire (013 avant 015).

## 3. Les 5 tables (A→O)
- `feature_flags` : PK code✓ FK✗(aucune) NOT NULL✓ DEFAULT✓ CHECK env✓ UNIQUE=PK✓
  index=PK✓ updated_at+trigger✓ audit=via audit_logs (pas de per-row, noté)✓
  RLS✓ GRANT✓ cycle=singleton logique✓ idempotent✓. Manquant : `starts/ends_at`
  non évalués (documenté futur), `target_roles` non évalué (documenté futur).
- `pages` : PK uuid✓ UNIQUE slug✓ soft-delete ABSENT (delete = hard — noté §12,
  acceptable config, pas de données utilisateur)✓ RLS✓ GRANT✓ idempotent
  (IF NOT EXISTS, pas de seed)✓.
- `seo_meta` : PK=FK cascade✓ (suppression couplée à la section — voulu) ;
  `slug` NON UNIQUE (F-01 MOYENNE : doublons possibles → recommandation :
  UNIQUE ou documenter ; correction exacte §16 si exigée) ; RLS lecture
  `USING(true)` = TOUTES les lignes y compris brouillons (F-02 FAIBLE :
  métadonnées d'affichage, acceptable ; revalider si contenu sensible).
- `menu_permissions` : PK composite (anti-doublon)✓ FK cascade double✓
  (permission supprimée ⇒ lien retiré, menu intact) RLS lecture seule✓
  (écriture service_role/Edge comme `role_permissions` 002 — cohérent)✓.
- `module_dependencies` : PK composite✓ anti-auto CHECK✓ cascades✓ RLS lecture✓.
  Cycles A→B→A : NON empêchables en SQL simple (F-03 MOYENNE traitée §7).

## 4. Feature flags
Clé PK✓ env CHECK✓ on/off✓ ciblage (colonne, non évalué — futur)✓ dates
(non évaluées — futur)✓ état✓ seed 7 flags par copie `ON CONFLICT DO NOTHING`
(idempotent : N puis N)✓ lecture publique restreinte (enabled+production)✓
activation exige `settings.manage`✓. Seed 007 = dépendance DOCUMENTÉE
(C-01) : absence ⇒ 0 ligne, sans erreur, sans danger (pas d'échec silencieux
dangereux : la table reste vide et visible comme telle). Pas de démo.

## 5. Pages + SEO
Relation pages↔seo : INDIRECTE (seo liée aux sections, pas aux pages —
conforme au modèle : SEO par section). Unicité : `pages.slug` UNIQUE✓,
`seo.slug` libre (F-01). Publication : `is_published` ; brouillon/archivage
pages = `is_published=false`/delete (pas de statut archivé — noté, acceptable
config). Visibilité publique gated✓. Versions multiples sans conflit (FK
cascade)✓. IDOR : lecture publique limitée aux publiées ; seo exposé (F-02,
acceptable).

## 6. Menu permissions
Objets existants liés✓ doublons impossibles (PK)✓ cascade protège menus✓
RLS = lecture seule, aucune modification API possible (même SUPER_ADMIN :
service_role/Edge — régime 002 conservé)✓ `menus.manage` mono-rôle NON
reproduit (aucune référence)✓ compatible 9 rôles (aucune référence rôle)✓.

## 7. Module dependencies
FK source/cible✓ anti-auto✓ anti-doublon✓ cascades (suppression module ⇒
arêtes retirées, jamais de module orphelin bloqué)✓. Cycles complexes :
impossibles à interdire en CHECK simple → INVARIANT APPLICATIF/SERVEUR :
contrôle à la création dans l'Edge `modules.manage` (parcours en profondeur
depuis `depends_on_module_id`, refus si `module_id` atteint) + future
contrainte trigger récursive ; sans ce contrôle, un cycle reste stockable
(impact : résolution d'ordre de chargement à protéger côté lecteur).

## 8. RLS (deny-by-default conservé dans tous les fichiers)
- `feature_flags` : anon/authenticated SELECT si enabled+production ;
  authenticated SELECT si `settings.view` ; ALL si view+`settings.manage`.
  CLIENT/VISITOR/commercial/chef/daf/dg : lecture publique seule ;
  ADMIN_GENERAL/SUPER_ADMIN : gestion. ADMIN_RH (sans settings.*) : publique seule — voulu.
- `pages` : public si `is_published` ; staff `cms.view`, écriture `cms.update`.
- `seo_meta` : lecture `USING(true)` (F-02) ; écriture `cms.update`.
- Liaisons : lecture `menus.view|roles.view` / `modules.view`, zéro écriture API.
- Aucun `USING(true)` sur donnée privée (seo = métadonnées d'affichage, noté).
- GRANTs : anon SELECT sur les 3 tables lisibles publiquement (requis par les
  policies) ; authenticated CRUD là où policies staff ; liaisons SELECT seul ;
  service_role jamais au frontend (revérifié : 1 occurrence = commentaire).

## 9. GRANTS
Cohérents avec §8. `service_role` non exposé. Sensible = serveur/RPC/Edge.

## 10. Seeds
Un seul (013, copie) : idempotent (2e exécution = N lignes), sans suppression,
sans écrasement (`DO NOTHING`, pas `DO UPDATE`), sans démo, reproductible.

## 11. Transactionnalité
Supabase SQL Editor = une transaction par script : échec ⇒ tout ou rien par
fichier. Échec milieu de vague ⇒ fichiers suivants non appliqués (ordre
documenté, reprise au fichier fautif). Seed partiel impossible (1 statement).
013 sans 007 ⇒ 0 ligne, détectable (T-A1).

## 12. Réversibilité
Documentée par fichier (DROP tables/colonnes, restore CHECK avec listes
d'origine — liste 004 citée pour `form_fields` ; pour `cms_sections` la liste
d'origine figure en commentaire de retour). Jamais de rollback auto destructif.
`pages`/`seo_meta` : DROP sans perte métier (config reconstructible).

## 13. Non-régression
Rien d'existant modifié sauf 2 CHECK (équivalents + étendus). Auth, profiles,
roles, permissions, org, CMS, menus, modules, forms, media, clients, projects,
quotes, ERP, closures, audit, Storage, 001→011 : intacts (fichiers non touchés,
revérifiés en listing).

## 14. Conformité Étape 2
9 rôles✓ (aucune redéfinition) · pas de `user_permissions`✓ · pas d'`owner`
ajouté ici (tables config, N/A — noté) · pas de référence séquentielle✓ ·
pas de TVA✓ · pas de montant✓ · audit append-only intact✓ · acteur fiable
intact✓ · sync/Gemini hors périmètre, rien les concernant✓ · permissions
serveur✓.

## 15. Tests A (locaux/statiques uniquement)
- T-A1 structure : NON TESTABLE pré-apply (objets absents — prouvé PGRST205).
  Requêtes fournies, résultats attendus chiffrés (7 flags, colonnes listées).
- T-A2 RLS : NON TESTABLE pré-apply (même raison).
- T-A3 cycle de vie : NON TESTABLE pré-apply.
- T-A4 non-régression : PASS (aucun objet existant modifié ; distant comportemental
  inchangé — lectures témoins OK ce jour).
- Rien de non exécuté n'est marqué PASS.

## 16. Verdict — problèmes et corrections
| ID | Gravité | Migration | Problème | Correction requise |
|---|---|---|---|---|
| F-01 | MOYENNE | 014 | `seo_meta.slug` non unique | Optionnelle pré-staging : `alter table seo_meta add constraint seo_slug_unique unique (slug)` — **proposée, NON appliquée** |
| F-02 | FAIBLE | 014 | `seo_public_read USING(true)` expose aussi le SEO des brouillons | Accepté (métadonnées d'affichage) ; revalider si contenu sensible — aucune action requise |
| F-03 | MOYENNE | 015 | cycles A→B→A stockables | Invariant Edge documenté §7 + trigger récursif futur ; aucune action SQL requise pré-staging |
| F-04 | FAIBLE | 013 | flags sensibles futurs lisibles si enabled+production | Convention : flags sensibles `env≠production` ou `is_enabled=false` par défaut — rien à changer |
| F-05 | FAIBLE | 014/015 | commentaires de rollback citent les listes sans les recopier pour `form_fields` | Relecture 004 disponible ; rien à changer |

## Conditions de staging
- C-01 : seed 007 présent (re-vérifier `features.defaults` en 1 SELECT au staging).
- C-02 : types compatibles (re-vérifier `information_schema` au staging).
- C-03 : DDL par rôle owner via Dashboard (procédure, inchangée).
- C-04 : staging/PITR : TOUJOURS NON CONFIGURÉS (bloquant pour prod, pas pour revue).

# VERDICT FINAL : A VALIDÉE POUR STAGING
Motif : SQL cohérent, additif, idempotent, RLS/GRANT alignés, aucune correction
bloquante ; findings F-01→F-05 non bloquants avec contrôles documentés.
Vague B non commencée. Arrêt ici.
