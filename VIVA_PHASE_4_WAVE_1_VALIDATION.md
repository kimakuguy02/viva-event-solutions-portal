# WAVE 1 — VALIDATION (TESTS A-L)
> À exécuter après : 1) déploiement 010 en SQL Editor, 2) attribution
> `settings.manage` à un compte staff de test (matrice 003 : ADMIN_GENERAL OK).

## Préparation distante (opérateur, une fois)

```sql
-- 010 déjà collée et exécutée : vérifier
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trg_audit_actor';
-- attendu : 1 ligne
```

## TEST A — modifier un paramètre (session SUPER_ADMIN ou ADMIN_GENERAL)
UI Super Admin → Configuration → basculer un flag (ex. `votingEnabled`).
Attendu : toast « confirmé serveur ».

## TEST B — vérifier dans PostgreSQL
```sql
SELECT key, value->>'votingEnabled' AS voting, updated_at
FROM public.app_settings WHERE key = 'features.defaults';
```
Attendu : valeur basculée + `updated_at` récent.

## TEST C/D — modifier à nouveau (ex. taux 2850 → 2851) puis revérifier
```sql
SELECT value FROM public.app_settings WHERE key = 'finance.defaults';
```
Attendu : `exchangeRateCDF = 2851`. Remettre 2850 après (hygiène).

## TEST E/F/G — reload + logout/login
Recharger le navigateur (valeur PG affichée), logout, login, revérifier
l'affichage. Attendu : persistance totale.

## TEST H/I — seconde session autorisée
Ouvrir un 2e navigateur (autre staff avec `settings.view`) : valeur visible.

## TEST J — CLIENT : lecture + écriture refusées
Connecté CLIENT (ou anon via API) :
```sql
-- à exécuter en tant que test applicatif (UI/API), pas en SQL Editor :
-- SELECT app_settings → 0 ligne ; upsert → erreur RLS.
```
Attendu : DENIED des deux côtés.

## TEST K — erreur simulée (RLS ou réseau)
Couper le réseau pendant un save, ou tenter sans permission.
Attendu : toast d'erreur explicite, ancienne valeur réaffichée, aucun succès.

## TEST L — audit serveur
```sql
SELECT action, resource, resource_id, actor_user_id, metadata, created_at
FROM public.audit_logs
WHERE resource = 'app_settings'
ORDER BY created_at DESC LIMIT 5;
```
Attendu : lignes `SETTINGS_FINANCE_UPDATED` / `FEATURE_FLAG_TOGGLED` avec
`actor_user_id` = UUID du compte admin (jamais NULL/forgeable après 010).

## P0 — reset sécurisé
Sans armer : appeler le reset (bouton isolé) → no-op + warn console.
Avec modal : taper autre chose que `RESET VIVA` → refus ; taper exact →
exécution locale seule ; vérifier qu'aucune table Supabase n'a bougé
(`SELECT updated_at FROM app_settings` inchangé).
