# Règles d'architecture — VIVA EVENT SOLUTIONS

Règles opposables à toute modification. En cas de conflit, la règle prime.

### RULE-001
Supabase est l'unique source de vérité.

### RULE-002
PostgreSQL contient les données métier structurées.

### RULE-003
Supabase Auth gère l'identité.

### RULE-004
Supabase Storage gère les fichiers.

### RULE-005
RLS protège les données.

### RULE-006
Le frontend n'est jamais une frontière de sécurité.

### RULE-007
Aucune autorisation critique ne repose uniquement sur React.

### RULE-008
Aucun secret privilégié dans le frontend (en particulier jamais de
`service_role`, jamais de `VITE_SUPABASE_SERVICE_ROLE_KEY`).

### RULE-009
Firebase n'est plus une technologie cible (legacy, gel des nouveautés).

### RULE-010
Express n'est pas une source de vérité.

### RULE-011
localStorage n'est pas une source de vérité.

### RULE-012
IndexedDB n'est pas une source de vérité.

### RULE-013
Gemini ne contourne jamais l'autorisation.

### RULE-014
Les opérations sensibles sont auditables.

### RULE-015
Les transactions validées sont immuables.

### RULE-016
Les données privées ne sont jamais rendues publiques uniquement pour
simplifier l'interface.
