# Architecture Gemini — VIVA EVENT SOLUTIONS

> Non développé (Phase 7). Contrat d'architecture figé dès la Phase 1 :
> l'IA est un assistant sous autorisation, jamais un acteur privilégié.

## Flux obligatoire

```
Utilisateur
  ↓ (prompt + contexte : auth.uid(), rôle, permissions)
Frontend
  ↓ (requête signée session, jamais de clé)
Edge Function `gemini-ask` (détient GEMINI_API_KEY côté serveur)
  ↓ (données lues via RLS avec le JWT utilisateur, jamais service_role sauf agrégats)
Gemini
  ↓ (plan d'actions proposé, JAMAIS de mutation directe)
Frontend — confirmation humaine explicite
  ↓ (actions confirmées une par une)
Vérification RBAC (has_permission / is_super_admin)
  ↓
Mutation Supabase (RLS) + audit_logs
```

## Règles

- Gemini ne reçoit que les données que l'utilisateur peut déjà lire (RLS).
- Aucune écriture sans confirmation humaine + contrôle RBAC serveur.
- Capacités par rôle : SUPER_ADMIN (CMS, modules, formulaires, config),
  ADMIN (son domaine), CLIENT (ses données), VISITOR (infos publiques).
- Clé Gemini : variable Edge uniquement, rotation documentée, jamais `VITE_*`,
  jamais loggée. Prompts/audits versionnés (`ai_actions` à prévoir Phase 7).
- Gemini ne stocke rien, n'est jamais source de vérité.
