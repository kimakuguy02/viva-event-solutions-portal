# VIVA PHASE 2 — AUDIT FINANCE EXISTANTE (lecture seule)
> Réf : migrations 004/005/011, `erpService.ts`, `EnterpriseErpContext.tsx`,
> `AccountingModule.tsx`, `ErpDashboard.tsx`, `server/api.ts` (sync).

## Opérations et chemins actuels
| Opération | Chemin Supabase | Chemin legacy | Serveur ? |
|---|---|---|---|
| Création transaction | INSERT RLS `erp.create` + trigger 011 (statut forcé) | Firestore mirror | Partiel (trigger) |
| Visa manager | AUCUNE policy UPDATE → refusé, repli Firestore | Firestore effectif | NON |
| Validation DAF + OTP | AUCUNE policy UPDATE → refusé, repli Firestore | Firestore + OTP `length===6` simulé | NON |
| Contrepassation | INSERT (RLS `erp.create`) | Firestore mirror | Partiel (trigger) |
| Clôture création | INSERT (`erp.validate` requis) | Firestore mirror | Partiel (RLS) |
| Clôture update/delete | `closures_staff` USING `erp.view` (trop large) | Firestore | NON |
| Soldes/mouvements | calcul client sur état fusionné | idem | N/A (lecture) |
| sync/push erp | permission `finance.approve` + champs validation stripés | JSON | Partiel |

## Tables/colonnes/enums/triggers/RLS/permissions
- `erp_transactions` : 19 col (montants NUMERIC, `validation_status` 4 états,
  visas UUID, `attachment_path`) ; index status ; triggers immutabilité +
  statut initial ; RLS SELECT `erp.view` / INSERT `erp.create` / **0 UPDATE/DELETE**.
- `cash_closures` : 10 col, UNIQUE(date, devise) ; `closures_staff` FOR ALL
  USING `erp.view` / CHECK `erp.validate` → **update/delete trop ouverts**.
- Permissions utilisées : `erp.view/create/update/validate`, `finance.approve`
  (legacy). Pas de TVA nulle part (conforme). Devises USD/CDF en CHECK.

## Lacunes bloquantes (→ RPC Étape 3)
L-1 : transitions manager/DAF sans chemin serveur (repli Firestore = autorité navigateur).
L-2 : OTP 6-chiffres généré/vérifié côté client (théâtre) ; aucun canal SMS/email.
L-3 : `closures_staff` USING trop large + aucune immutabilité des clôtures validées.
L-4 : `actor/approved_by` = noms display côté client (pas d'uid vérifié).
L-5 : références `FAC-REC/BL-DEP-YYYY-####` aléatoires (collision + énumération).
L-6 : `/sync/push` legacy accepte `erp_transactions` (permissionné Phase 1, mais JSON).

## Non touché par cet audit (lecture seule respectée)
Aucune donnée, migration, RLS ou code modifié dans cette étape.
