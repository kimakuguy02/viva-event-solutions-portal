# VIVA PHASE 2.1 — SUPER ADMIN + PLATFORM BUILDER (COMPLETION)
> Produit uniquement. Aucune migration Supabase, aucune suppression legacy,
> aucune donnée touchée. `tsc` PASS, `build` PASS (47s).

## Fonctionnalités terminées
- Dashboard Super Admin réel (`SuperAdminDashboard`) : compteurs issus des
  contextes chargés + activité récente (audit réel) + état session ; vide
  explicite partout, 0 statistique inventée.
- Rôles & Permissions (`RolesPermissionsManager`) : 9 canoniques (reflet
  seeds 003, lecture seule), création/duplication/activation de rôles
  personnalisés **de session**, matrice 13 modules × 11 actions avec
  permissions effectives calculées.
- Workflow Builder (`WorkflowBuilder`) : 6 étapes REQUEST→CLOSURE, responsables
  par rôle, délais, simulation visuelle marquée (aucune exécution).
- Audit Center (`AuditCenter`) : recherche, filtres résultat/module, détail —
  sur audit réel uniquement.
- Security Center (`SecurityCenter`) : session réelle, refus/échecs réels,
  changements sensibles réels, paramètres déclaratifs.
- Gemini Copilot (`GeminiCopilot`) : conversation, suggestions, actions
  proposées avec confirmation ; confirmations = simulations marquées, 0 clé,
  0 mutation, 0 contournement.
- Socle partagé (`AdminUI`, `types/platformBuilder`, `hooks/useAuditEvents`).

## Fonctionnalités partielles (intégration Hub)
- Hub : 20 sous-menus (workflows ajouté) ; overview/roles-perms/gemini/
  audit/security rebranchés ; users/menus/modules/forms/media/orga/config
  conservés tels quels.

## Fichiers créés (9)
`types/platformBuilder.ts`, `components/admin/AdminUI.tsx`,
`SuperAdminDashboard.tsx`, `RolesPermissionsManager.tsx`,
`WorkflowBuilder.tsx`, `AuditCenter.tsx`, `SecurityCenter.tsx`,
`GeminiCopilot.tsx`, `hooks/useAuditEvents.ts`.

## Fichiers modifiés (1)
`components/admin/SuperAdminHub.tsx` (imports, onglet workflows, branchements,
renumérotation, retraits d'imports morts). Aucune logique métier existante
touchée.

## Architecture
UI → hook/context existant → service Supabase ou legacy documenté.
`useAuditEvents` : Supabase (si session) → Firestore temps réel → local,
source labellisée, timeout 4s, jamais de vide comblé par du faux.

## Data requirements (bloquent la finalisation, pas le produit)
- R2-01 : persistance rôles personnalisés + grants → tables `roles`,
  `role_permissions` (+ Edge d'attribution SUPER_ADMIN).
- R2-02 : moteur workflows → `workflows`, `workflow_steps`,
  `workflow_instances`, notifications.
- R2-03 : audit unifié (déjà `audit_logs` ; brancher tous les writers).
- R2-04 : Gemini Edge `gemini-ask` + `ai_actions` (contexte RBAC, confirmation).
- R2-05 : annuaire users/roles serveur (remplace `viva_managed_users`).
- R2-06 : notifications/alertes temps réel (table + Realtime).

## Problèmes rencontrés
- JSX mal fermé (carte rôle) + inférence `Map`/`Object.values` : corrigés,
  tsc vert.
- `useAuditEvents` : cleanup d'abonnement typé strictement (retour
  `subscribeFirestoreCollection` non-Unsubscribe dans un chemin) — contourné
  par cast localisé et documenté ; à typer proprement (dette mineure).

## Tests
- `npx tsc --noEmit` : PASS (0 erreur). `npm run build` : PASS.
- Vérifications manuelles à faire (pas de framework de test) : onglets Hub,
  recherche/filtres audit, création rôle custom (volatile après reload —
  attendu), simulation workflow (visuelle), copilot sans réseau IA.
- Non régression : managers existants intacts (mêmes props), contexts
  inchangés.

## Prochaines dépendances (hors portée, ne pas commencer)
Phase 3 DB définitive (R2-01→R2-06), RPC financier, Storage couplé, purge
mocks/PII, secrets, tests/CI. Aucune migration créée dans cette phase.
