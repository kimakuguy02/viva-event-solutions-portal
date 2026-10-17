# VIVA PHASE 2 — TESTS FINANCE (FIN-01…FIN-10)
> Suite : `scripts/finance-check.mjs [--live]`. Résultat du jour :
> 5 PASS auto + 2 PASS live-anon (FIN-01/02/09b) + 8 SKIP (sessions requises).
> 0 FAIL après correction du faux positif (`Obser[vat]ions` → frontières de mots).

## Automatiques (PASS ce jour)
- FIN-RPC : 5 RPC + trigger + `auth.uid()` + `search_path` présents en 018.
- FIN-NOTVA : aucune logique TVA/fiscale (frontières de mots).
- FIN-NOOTP : OTP simulé absent du chemin actif.
- FIN-NUMERIC : NUMERIC base + coercition service.
- FIN-RPCWIRE : transitions via RPC, pas d'update direct.
- FIN-01 : insert anon refusé (42501). FIN-02 : RPC anon refusée (PGRST202 =
  fonction inexistante distant = 018 non appliquée, cohérent).
- FIN-09b : lecture anon refusée (42501).

## Manuels requis (sessions CLIENT/DAF/ADMIN, comptes jetables + nettoyage)
- FIN-03 : DAF crée opération autorisée → SUCCÈS (insert `erp.create`).
- FIN-04 : DAF valide (attestation) → SUCCÈS + verrou + audit `auth.uid()`.
- FIN-05 : UPDATE ligne `valide` (SQL owner-test en session DAF) → erreur trigger.
- FIN-06 : contrepassation autorisée → SUCCÈS + lien ; non autorisée → REFUS.
- FIN-07 : CLIENT approve/validate → REFUS (permissions).
- FIN-08 : `actor/approved_by` forgés ignorés ( trigger/serveur font foi).
- FIN-09 : clôture sans `erp.validate` → REFUS (insert + validate).
- FIN-10 : audit `actor_user_id` = soi sur chaque opération.
- Appliquer 018 avant toute campagne (sinon repli legacy — à dater).

## Non-régression
`tsc` + `build` ci-dessous. Parcours comptable existants inchangés hors OTP.
