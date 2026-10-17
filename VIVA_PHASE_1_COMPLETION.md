# VIVA PHASE 1 — COMPLETION (Hardening + SSOT)
> `tsc` PASS (0), `build` PASS, suite sécurité 10/10 PASS + 0 SKIP (live inclus).

## 1-3. Résumé / avant / après
Avant : sync ouvert, CSP partielle + `godMode` au /health, JSON 10 Mo, PII démo
réalistes, faux succès upload/signature, throttle partiel, secrets flous.
Après : sync permissionné + borné (100) + refus audités + verrou validation ERP,
CSP stricte (YouTube/Supabase/Firebase préservés) + JSON 1 Mo + /health minimal,
throttle partagé branché (devis 3/5min, réservations 3/10min), PII anonymisée
(fictifs `.invalid`, `00 000 00xx`, revenus démo à zéro), upload en erreur
franche, signature fabriquée supprimée, `.gitignore` couvre bases runtime.

## 4-7. Fichiers
Modifiés (12) : `server/api.ts`, `server.ts`, `.gitignore`, `visitorTrackingService.ts`,
`ClientAuthModal.tsx`, `ClientRegistrationModal.tsx`, `EventReservationModal.tsx`,
`OfficialAnnouncementsModule.tsx`, `storageService.ts`, `MediaManager.tsx`,
`InteractiveQuoteForm.tsx`, `enterpriseErpData.ts`, `RolesManagerModal.tsx`,
`RolesAndUsersManager.tsx`, `AuthContext.tsx`.
Créés : `src/utils/rateLimit.ts`, `scripts/security-check.mjs`,
`VIVA_PHASE_1_{INITIAL_AUDIT,SECRETS_REPORT,FINANCE_BLOCKERS,COMPLETION}.md`.
Supprimés : `generateStorageSignatureUrl` (morte). Migrations : 0.

## 8-15. Sécurité → Supabase
Secrets : inventoriés, rotation documentée NON exécutée (sans secret manager) ;
auth/RBAC inchangés (déjà Supabase-first, 0 bypass) ; RLS reverifiée live ;
Storage gelé (contenu buckets non vérifié) ; API verrouillée ; SSOT confirmée ;
audit : trigger + chemins Wave (writers admin locaux restants).

## 16-18. Legacy / risques / tests
Legacy conservé et cartographié. Risques restants : rotation non exécutée,
RPC financier (F-1→F-9), `INITIAL_*`/institutionnels restants, rate-limit
serveur inserts publics (R4), CSP à valider en navigation réelle, PII
institutionnelle légitime vs démo (arbitrage documenté), `data/*.json` locaux.
Tests : suite 10/10 ; manuels restants : RBAC sessions, Express live, audit
live, parcours A→G, CSP YouTube/embeds.

## 19-22. tsc / build / bloqueurs / Phase 2
tsc PASS (2 erreurs introduites corrigées, 0 masquée). Build PASS. Bloquent
encore la prod : rotation, RPC, PII résiduelles, rate-limit serveur, CSP réelle,
backups/PITR/staging, E2E/CI, mocks prod, OTP DAF.
Phase 2 : finir PII → Edge rate-limit → RPC → Storage couplé → cutover →
décommission.

# VERDICT : PHASE 1 PARTIAL
Critères non soldés : rotation exécutée, rate-limit serveur, PII totale,
tests manuels, Storage contenu. Aucune faille introduite, rien cassé.
