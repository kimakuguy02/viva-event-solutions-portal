# VIVA PHASE 2 — IMPLÉMENTATION FINANCE SERVEUR
> Réf : `VIVA_PHASE_2_FINANCE_AUDIT.md`, migration `20261007_018_finance_rpc.sql`
> (locale, à appliquer par le propriétaire — 018 NON déployée à ce jour).

## Migration 018 (locale, non appliquée)
- Séquence `viva_ref_seq` + RPC `reference_mint` (préfixe validé, permission
  `erp.create`/`quotes.create`, anti-énumération `PREFIX-YYYY-NNNNNN`).
- `erp_approve_manager` : auth + `erp.update`, état `en_attente_manager` requis,
  approbateur ≠ initiateur, audit serveur.
- `erp_validate_daf` : `erp.validate`, état `en_attente_otp_daf` requis,
  validateur distinct des deux autres, verrouillage + audit. Attestation
  nominative (canal OTP réel non connecté — affiché, jamais simulé).
- `erp_reverse_tx` : `erp.validate`, motif ≥ 8 chars, transaction `valide`
  requise, contre-écriture liée (`reversed_by`), audit.
- `closure_validate` + colonnes `validated_by/at` + trigger immutabilité
  (update de validée refusé, delete toujours refusé) + RLS clôtures resserrée
  (`erp.validate` pour update/delete, lecture `erp.view`).
- `EXECUTE` révoqué au public, accordé `authenticated`/`service_role`.
- Toutes SECURITY DEFINER + `search_path=public` ; acteur toujours `auth.uid()`.

## Frontend
- `erpService` : `rpcApproveManager/rpcValidateDaf/rpcReverseTx/
  rpcValidateClosure` + `isRpcMissing` (PGRST202 → repli legacy explicite,
  jamais silencieux) ; `setTxValidation` dépréciée (conservée, non utilisée).
- Contexte : approve/validate/reverse/closure via RPC d'abord ; refus non-RPC
  → erreur propagée (aucun faux succès) ; RPC absente → miroir legacy + warn.
- UI : modale OTP simulée SUPPRIMÉE (code + boîte d'aide + "coller le code") ;
  attestation DAF nominative avec note ; libellés OTP → attestation ;
  code mort ErpDashboard supprimé (jamais invoqué) ; erreurs explicites partout.

## Legacy
`server/api.ts` sync erp : permissionné Phase 1 + champs validation stripés
(inchangé). Chemins Firestore : ACTIVE (miroirs) / DEPRECATED (transitions dès
018 appliquée) / UNUSED (OTP simulé supprimé). Aucun contournement RPC possible
côté legacy (pas de policy UPDATE).
