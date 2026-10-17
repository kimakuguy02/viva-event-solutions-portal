# VIVA PHASE 1 — AUDIT INITIAL (pré-modification)
> Lecture seule. Vérifié le 07/10/2026.

## Architecture actuelle
React 19 + Vite 6 + Tailwind, routage par état (~21 onglets), 4 contexts,
~90 composants, 11+ services, Express (`server/`) + Firestore + Supabase
partiel (auth, settings, 8 familles en double-écriture + vague A déployée).
`package.json` : scripts dev/build/start/preview/lint(=tsc). Pas de CI, pas de
tests, pas de Docker, `bun.lock` seul.

## Sources de vérité (6 actives)
Supabase (partiel) · Firestore (16 collections, runtime) · Express JSON
(`data/viva_database.json`, 36 Ko, contient `passwordHash`) · localStorage
~25 clés · IndexedDB ×2 · mémoire/`INITIAL_*`. Divergences documentées
(last-write-wins, overlays PG-gagne).

## Risques (confirmés ce jour)
- R-S1 `POST /sync/push` (`server/api.ts:231`) : `requireAuth` seul, `...data`
  brut vers JSON — contourne Supabase/RLS. Bypass admin : AUCUN actif
  (`loginAsClient`/`setUserRole`/`admin_general_token` absents du chemin actif ;
  ne subsistent qu'en commentaires + `god_mode`/`all_access` dans mocks/RBAC
  legacy). Secrets : `.env` présent avec `SESSION_SECRET/ADMIN_PASSWORD` réels ;
  `.gitignore` couvre `.env*` ✅ mais pas de dépôt git ici — rotation obligatoire
  au déploiement ; `firebase-applet-config.json` (clé publique par design) ;
  `data/*.json` avec hashes. PII : téléphones institutionnels (légitimes) +
  4 contacts démo réalistes (`visitorTrackingService.ts:32-127`, à purger) +
  `Dr. Patrick Mukendi` en aide de saisie (`ClientAuthModal:98`).
- Fichiers concernés : `server/api.ts`, `server/auth.ts`, `server/db.ts`,
  `.env`, `data/viva_database*.json`, `src/services/*`, `src/context/*`.
- Routes : onglets App (~21, toutes rendues, 404 sinon) + `#auth/admin-access`.
- Migrations : 17 locales (001→011 + 012→015 + 016/017 B + 010/011) ; distant :
  001→011 + 012→015 appliquées (vérifié), 016/017 locales seules.
- Déjà réellement Supabase : auth, settings, CMS/menus/modules/forms/orga/
  médias/projets/devis/ERP-inserts + vague A (tables vides consommées par
  FeatureFlagManager). Encore legacy : users/rôles admin, audit admin,
  validations ERP, tickets/votes/live, Storage Firebase, sync Express.

## Recommandations (ordre)
Secrets → sync/push → auth/RBAC → XSS/CSP → rate-limit → PII → SSOT →
faux succès → Storage → audit → tests.
