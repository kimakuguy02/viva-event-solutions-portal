# VIVA — VAGUE A — RAPPORT STAGING
> Environnement vérifié le 07/10/2026. AUCUNE migration appliquée, AUCUNE
> donnée touchée, AUCUN fichier applicatif modifié. Seul ce rapport est créé.

## 1. Environnement staging vérifié : NON IDENTIFIÉ
- Seules credentials présentes : `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  (noms seuls vérifiés, valeurs jamais affichées) → **un seul projet connu**,
  celui de production. Aucune URL/key staging, aucun accès owner/service_role.
- Conclusion §0 : **STAGING non distinct de PRODUCTION → STOP IMMÉDIAT.**
  Rien n'a été appliqué (ni staging, ni — et surtout pas — production).

## 2. Backup vérifié : NON DISPONIBLE
- Aucune preuve PITR/backup (ni Dashboard consultable d'ici, ni artefact).
- Statut : `BACKUP PRÉALABLE NON DISPONIBLE`. Même avec staging, exiger une
  sauvegarde restaurable avant tout DDL.

## 3. État avant : inchangé (base production = 001→011)
- 25 tables + seeds + RLS + buckets conformes aux validations 001→009.
- 5 nouveaux objets 012→015 : ABSENTS distant (PGRST205 revérifié) — pré-état correct.

## 4-5. Migrations / correction F-01 : NON EXÉCUTÉES
- F-01 (`seo_meta.slug` UNIQUE) : correction exacte prête mais **NON appliquée**
  (interdit sans staging) :
  ```sql
  alter table public.seo_meta add constraint seo_meta_slug_unique unique (slug);
  ```
  À intégrer au script de staging avant 014, ou en `016` dédiée — décision humaine.

## 6-9. Tests : NON EXÉCUTABLES
T-A1→T-A4, A5→A13, RLS par rôle, seeds, non-régression, fonctionnels :
**NON TESTABLES** sans staging (refus de simuler).

## 10. Conditions C-01→C-04
| ID | État |
|---|---|
| C-01 seed `features.defaults` | NON RE-VÉRIFIÉ d'ici (lecture anon refusée ; prouvé présent au déploiement 007) — à re-vérifier au staging en 1 SELECT |
| C-02 types distants | NON VÉRIFIABLE d'ici (pas d'introspection) |
| C-03 DDL owner | NON DISPONIBLE d'ici (anon seule) — à exécuter par le propriétaire via Dashboard |
| C-04 staging identifié | **NON** — bloquant |

## 11. Pour débloquer (actions propriétaire, dans l'ordre)
1. Créer le projet Supabase **staging** (distinct), activer PITR/backups,
   noter la preuve (capture `Database → Backups`).
2. M'y donner accès **lecture** (URL + anon) pour constats, et appliquer
   vous-même 012→015 (+F-01) via SQL Editor owner dans l'ordre.
3. Me transmettre les résultats ; j'exécute alors tests T-A1→A13 + RLS réels.
4. Seulement après `A STAGING VALIDÉE` : planifier la production (backup
   prouvé + fenêtre + rollback).

## 12. Rollback/réparation
Sans objet (rien appliqué). Rappel : retours documentés par fichier dans les
headers 012→015 ; jamais de restore global sans sauvegarde.

# VERDICT FINAL : STAGING BLOQUÉ
Motifs : staging non identifié (un seul projet connu), DDL indisponible d'ici,
backup non prouvé. Vague B non commencée. En attente : staging + accès +
application owner de 012→015 (+F-01).
