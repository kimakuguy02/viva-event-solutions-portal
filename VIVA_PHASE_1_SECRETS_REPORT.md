# VIVA PHASE 1 — RAPPORT SECRETS
> Aucun secret détruit (interdit sans explication). `.env` local conservé
> (nécessaire au boot Express) ; `.gitignore` étendu aux bases runtime.

## Inventaire
| Secret | Emplacement | Exposé frontend ? | Action |
|---|---|---|---|
| `SESSION_SECRET` | `.env` (+ `.env.example` vide) | Non (serveur seul) | ROTATION requise au déploiement (invalide toutes sessions) |
| `ADMIN_PASSWORD` | `.env` | Non | ROTATION + reset mots de passe + suppression `data/*.json` au déploiement |
| `ADMIN_EMAIL` | `.env` / `.env.example` (défaut) | Non (config) | Conserver, vérifier titulaire |
| `VITE_SUPABASE_URL/ANON_KEY` | `.env.local` / `.env.example` (vides) | Oui, par design Supabase (anon) | OK ; jamais de `service_role` (vérifié : absent) |
| `GEMINI_API_KEY` | `.env.example` (vide) | Non configurée (bien) | Ne jamais préfixer `VITE_` ; usage Edge futur |
| Firebase `apiKey` | `firebase-applet-config.json` | Oui, par design Firebase | OK ; à retirer avec Firebase (Phase 10) |
| Hashes/sels bootstrap | `data/viva_database*.json` | Non (disque serveur) | Ignorés git (ajout `.gitignore`) ; ROTATION via reset au déploiement |
| PII démo | `visitorTrackingService.ts:32-127`, `ClientAuthModal:98` | Oui (noms/tél réalistes) | Purge Bloc 6 (anonymisation, pas de suppression de seeds institutionnels) |

## Règles appliquées
Frontend : uniquement `VITE_SUPABASE_URL/ANON_KEY` (+ config Firebase publique
legacy). Aucun `service_role`, secret API, mot de passe ou clé privée dans
`src/` (vérifié par recherche : 0 hit). Gemini : clé jamais côté client.
