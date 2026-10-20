# Architecture de sécurité — VIVA EVENT SOLUTIONS

> État : cible documentée. Les problèmes Phase 0 restent OUVERTS jusqu'à leur
> phase de correction. Ne pas considérer ce document comme une attestation.

## Périmètre

Auth, RLS, RBAC, Storage, API/Edge, secrets, uploads, XSS, IDOR, escalade,
PII, rate limiting, audit, logs, sessions.

## Findings repris de la Phase 0

| ID | Problème | Impact | Correction | Phase |
|---|---|---|---|---|
| SEC-01 | `loginAsClient` sans mot de passe | Usurpation client | Supabase Auth, suppression | 2 |
| SEC-02 | `setUserRole` élévation console | Prise de rôle admin | Suppression + RLS | 2 |
| SEC-03 | Auto-`admin_general` par email | Hijack par pré-inscription | Vérif serveur, jamais d'auto-promotion | 2 |
| SEC-04 | `/api/sync/push` sans autorisation | Défacement + fraude | `requirePermission` + validation Zod, puis suppression | 2/3 |
| SEC-05 | XSS stockée CMS/menus | Vol session (token localStorage) | Sanitize + CSP + cookies httpOnly | 2/3 |
| SEC-06 | `.env` secrets versionnés | Compromission comptes | Rotation + purge historique + secrets manager | 2 |
| SEC-07 | `audit_logs` Firestore créables sans auth | Falsification audit | Audit serveur append-only | 8 |
| SEC-08 | Storage Firebase tout-signé + faux succès | Hébergement abusif, perte fichiers | Buckets 006 + Edge strict | 6 |
| SEC-09 | Firestore `erp_tasks` lisibles tout signé | Fuite interne | RLS `erp.view` | 3/5 |
| SEC-10 | OTP `Math.random()` affiché | 2FA fictive | OTP serveur TTL + canal réel | 2 |
| SEC-11 | PBKDF2 10k + salt réutilisé | Cassage mot de passe | Argon2/210k+ + pepper, reset forcé | 2 |
| SEC-12 | Logout ineffectif (8h stateless) | Session persistante | TTL court + denylist/refresh | 2 |
| SEC-13 | PII démo dans le code | Fuite RGPD | Anonymisation + purge historique | 2 |
| SEC-14 | Pas de CSP/HSTS/CORS/rate-limit | Durcissement absent | `helmet`, CORS strict, Redis RL | 2/9 |

## Principes appliqués

- `auth.uid()` seule source d'identité ; triggers `SECURITY DEFINER`
  `search_path=public` verrouillé ; `EXECUTE` restreint (`authenticated`,
  `service_role`).
- Uploads : type/taille/ownership vérifiés Edge, jamais `contentType` client seul.
- IDOR : toute ressource owner-scopée (`submitted_by/owner/lead/assigned`).
- PII : aucune donnée personnelle dans les seeds/logs ; `metadata JSONB` minimisé.
- Sessions : TTL court, refresh rotatif, cookies `HttpOnly;Secure;SameSite`.

## Corrections locales (2026-10-20)

Ces changements sont présents dans le dépôt ; leur déploiement distant reste à
vérifier séparément.

- Storage : la session Supabase utilise les buckets et policies RLS existants ;
  médias publics, fichiers privés sous le préfixe UID et liens privés signés à
  durée limitée. Le repli Firebase legacy applique des règles plus strictes,
  avec lecture privée par propriétaire et écriture du personnel par liste de
  comptes vérifiés. En cas d'échec d'enregistrement des métadonnées média, le
  client tente de supprimer le fichier et signale explicitement tout échec de
  nettoyage ; la suppression d'une fiche média supprime aussi son objet et
  remonte tout refus. Cette liste est transitoire : la cible reste une
  autorisation par custom claims gérés côté serveur.
- Finance : création, visas, validation DAF, contrepassation et clôture ne
  basculent plus sur Firestore ou l'état local lorsque Supabase/RPC est absent.
  La migration 023 déplace le calcul et la création des clôtures dans une RPC,
  et retire le droit d'INSERT direct. Les échecs sont remontés à l'interface.
  Les soldes d'ouverture codés en dur ont été retirés ; le calcul de clôture
  indique explicitement l'absence d'un solde d'ouverture configuré et ne peut
  donc pas déclarer une clôture conforme avant configuration.
- Sessions Express : un jeton doit encore exister dans la liste serveur ; les
  comptes suspendus ou supprimés sont refusés, les rôles/permissions sont
  relus depuis la base et le logout révoque le jeton présenté.
- À vérifier avant production : déployer les règles Storage et les migrations
  financières 018 et 023, confirmer les rôles/email vérifiés autorisés, puis
  exécuter les tests avec Firebase Emulator et contre un environnement Supabase
  de test.
