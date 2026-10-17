# VIVA — REVUE FINALE BLOC A (pré-application, sans exécution)
> Fichiers : `VIVA_MIGRATION_A_FINAL.sql` (294 lignes). Rien exécuté, rien modifié
> d'autre. Contrôle automatisé : 0 `DROP TABLE` / `TRUNCATE` / `DELETE FROM public.*`
> exécutable (occurrences uniquement en commentaires + `DROP TRIGGER/POLICY/
> CONSTRAINT IF EXISTS` d'idempotence).

## SQL généré
Bloc unique : §0 préconditions (DO bloquant si 001/004 absentes ; NOTICE si
seed 007 absent) → §1 012 (+COMMENTs) → §2 013 (table+trigger+3 policies+
GRANTs+seed copie) → §3 014 (2 tables+trigger, F-01 via DO+`pg_constraint`,
4 colonnes, index, CHECK rebuild, 4 policies, GRANTs) → §4 015 (4+3+4+2
colonnes, 2 tables liaison, CHECK rebuild, 2 policies, GRANTs) → §5 neuf
SELECT de vérification (tables, RLS, policies, index, contraintes, seeds,
doublons slug, 25 historiques). Transaction unique côté éditeur.

## Ordre d'exécution
Préconditions → 012 → 013 → 014 (F-01 incluse) → 015 → vérifications.
013 avant 015 impératif (FK `feature_flag`) ; 012 indépendante mais première
par convention ; F-01 placée après `seo_meta` (table requise), avant usage.

## Objets concernés
Créations : 5 tables, 3 triggers, 12 policies, ~10 GRANTs, 14 colonnes,
2 index, 1 contrainte F-01. Modifications : 2 CHECK reconstruits (listes
élargies, noms auto-004 conservés). Seeds : 7 flags par copie (`DO NOTHING`).

## F-01
`seo_meta_slug_unique` via DO + test `pg_constraint` (idempotent, additif,
0 ligne existante possible à l'application puisque table nouvelle ; à terme :
slugs explicites obligatoires, `''` en double refusé — comportement voulu).

## Risques
- Seed 007 absent ⇒ 0 flag + NOTICE (visible, non silencieux-dangereux).
- Divergent de type préexistant ⇒ `ADD COLUMN IF EXISTS` ne normalise pas
  (C-02, à vérifier au staging).
- `seo_public_read USING(true)` : inchangé vs 014 validé (métadonnées).
- Rollback : par objet (DROP ciblés), jamais global ; données historiques
  intouchées par construction.

## Vérifications (attendues §5)
5 tables / RLS 5×true / 9 policies / 2+ index / 8 contraintes / 7 flags (ou 0
avec NOTICE) / 0 doublon slug / 25 historiques.

## Préconditions manuelles (propriétaire)
1. Projet = VIVA actuel (pas de staging distinct — décision actée).
2. Backup prouvé avant exécution (toujours non prouvé : à obtenir).
3. Exécuter le bloc ENTIER d'un coup dans SQL Editor (pas morceau par morceau).
4. Copier les 9 résultats de vérification pour analyse.

## Verdict : READY_TO_APPLY (sous backup prouvé)
Vague B non commencée. En attente : backup + exécution owner + résultats.
