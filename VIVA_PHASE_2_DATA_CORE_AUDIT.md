# VIVA PHASE 2.2 — AUDIT DATA CORE (28 domaines, réel vérifié)
> Lecture seule + sondes anon. Légende table : ✅ présente distant / ❌ absente
> (PGRST205) / 🔒 présente mais anon-refusée (42501 = existe).

| Domaine | Table Supabase | Lecture actuelle | Écriture actuelle | RLS | Audit | État |
|---|---|---|---|---|---|---|
| USERS | `profiles` 🔒 | Supabase (session) + mock local | Supabase (self) / mock local | ✅ | trigger acteur | 🟡 partiel |
| ROLES | `roles` 🔒 | Mock local + seeds | Mock local | ✅ | — | 🟠 mock |
| PERMISSIONS | `permissions` 🔒 + matrice | Mock local (matrice seed) | Mock local | ✅ | — | 🟠 mock |
| NOTIFICATIONS | ❌ | Session (journal domaine + audit refus) | Session | — | — | 🟠 session |
| TICKETS | ❌ | Mémoire + badge session | Mémoire | — | — | 🟠 session |
| CLIENTS | `clients` 🔒 | Supabase-first + miroir | Supabase-first + miroir | ✅ owner/staff | ✅ | 🟡 partiel |
| CONTACTS | ❌ | Session liée (R3-11) | Session | — | — | 🟠 session |
| INTERACTIONS | ❌ (+`crm_interactions` non déployée, mig 016 locale) | Firestore + mémoire | Firestore | legacy | legacy | 🟠 legacy |
| PROJECTS | `projects` 🔒 | Supabase-first + miroir | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| TASKS | `erp_tasks` 🔒 | Supabase-first + miroir + Kanban | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| TEAMS | ❌ (`project_members` non déployée) | Champ `team[]` miroir | Miroir | — | — | 🟠 miroir |
| MILESTONES | ❌ | Champ miroir + UI drawer | Miroir | — | — | 🟠 miroir |
| DELIVERABLES | ❌ | Champ miroir + UI drawer | Miroir | — | — | 🟠 miroir |
| EQUIPMENT | ❌ | Firestore + mémoire (`INITIAL_*`) | Firestore | legacy | legacy | 🟠 legacy |
| PURCHASES | ❌ | Session + workflow UI | Session | — | — | 🟠 session |
| DOCUMENTS | ❌ (`client_documents` non déployée) | URLs réelles si présentes | — | — | — | 🟡 partiel (lecture seule réelle) |
| QUOTES | `quotes` 🔒 | Supabase-first + miroir | Supabase-first + miroir | ✅ A↔B prouvé | ✅ | 🟡 partiel |
| QUOTE ITEMS | `quote_items` 🔒 | Non exploité par l'UI | — | ✅ | — | 🟠 non branché |
| CMS/Pages/SEO | ✅ + vague A déployée | Supabase-first + miroir | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| MENUS/MODULES | ✅ + vague A déployée | Supabase-first + miroir + arbre session | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| FORMS | `forms/fields` 🔒 (+`submissions` 🔒) | Supabase-first + miroir | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| ORGANIZATION | `org_units` ✅ | Supabase-first + miroir | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| MEDIA/YouTube | ✅ | Supabase-first + miroir | Supabase-first + miroir | ✅ | ✅ | 🟡 partiel |
| FEATURE FLAGS | ✅ déployée | Supabase SSOT | Supabase SSOT | ✅ | ✅ | ✅ réel |
| SETTINGS | `app_settings` 🔒 | Supabase SSOT | Supabase SSOT | ✅ | ✅ | ✅ réel |
| ERP/FINANCE | `erp_transactions/closures` 🔒 | Insert PG + transitions legacy (0 policy UPDATE volontaire) + RPC 018 locale | Mixte | ✅ insert, RPC à venir | ✅ | 🟡 partiel (RPC non déployée) |

Doublons sources par domaine : Firestore + localStorage + IndexedDB + mémoire
coexistent partout hors settings/flags. `quote_items`, `module_permissions`,
`form_fields` riches : non consommés par l'UI. Tables 016/017 + C/D : PGRST205.
