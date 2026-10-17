# REVIEW — Migration 020 (vague C2 : OHADA + trésorerie)
> Non appliquée. Additive, idempotente, zéro TVA (aucune colonne taxe).

- Tables : `journals`, `ohada_accounts` (PK code), `journal_entries`
  (débit/crédit > 0 exigé par ligne, FK cascade tx / restrict comptes),
  `opening_balances` (UNIQUE compte+devise), `treasury_balances` (PK),
  `reconciliations` + colonnes `cash_closures.validated_by/at`.
- RLS : lecture `erp.view` seule ; AUCUNE écriture directe (RPC/Edge) — la
  partie double sera imposée dans `erp_validate` (extension 018).
- Risques : seed du plan comptable officiel manquant (à fournir par la DAF,
  jamais inventé) ; `check_journal_balance` volontairement absent (pas de
  fonction fantôme) ; soldes d'ouverture sans source (R4-22, saisie DAF).
- Rollback : DROP tables ordre inverse + DROP colonnes closures.
