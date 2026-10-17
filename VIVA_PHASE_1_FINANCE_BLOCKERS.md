# VIVA PHASE 1 — FINANCE BLOCKERS (opérations exigeant RPC/serveur)
> Constat : structures conservées, failles critiques supprimées, aucune fausse
> sécurisation frontend. Chaque ligne = RPC/Edge à créer en phase DB.

| # | Opération | Pourquoi RPC | État actuel (sûr) |
|---|---|---|---|
| F-1 | Validation double-signature (`erp_validate`) | OTP serveur + séparation initiateur/manager/DAF + verrou `valide` | Legacy Firestore explicite ; aucune policy UPDATE (refus par défaut) |
| F-2 | Contrepassation (`erp_reverse`) | Lien `reversed_by`, montants liés, jamais de suppression | Insert cont joint, trigger 011 force statut sans droit |
| F-3 | Passage `valide` direct à l'insert | Trigger 011 force `en_attente_manager` sans `erp.validate` | Actif distant (à re-tester) |
| F-4 | Clôtures (théorique calculé, validation) | Calcul serveur + `validated_by/at` | Insert `erp.validate` exigé ; théorique encore client (R4-23) |
| F-5 | Références non séquentielles | `reference_mint` anti-énumération | Refs aléatoires 900 valeurs (faible, documenté) |
| F-6 | Totaux devis/factures | Recalcul serveur avant `approved` | Montants navigateur (affichage), approve = RLS `quotes.approve` |
| F-7 | Soldes d'ouverture/trésorerie | Saisie DAF double-validée | Constantes codées supprimées ; calculs sur validées + mention R4-22 |
| F-8 | OHADA (partie double, journaux) | Contrainte serveur + plan officiel | Dérivé en lecture seule ; tables R4-19 |
| F-9 | TVA | Aucune auto (décision produit) | Respectée ; lignes explicites opt-in (R4-15) |
