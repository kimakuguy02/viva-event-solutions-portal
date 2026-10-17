# Security Specification & Test Payloads — VIVA EVENT SOLUTIONS PORTAL

## 1. Data Invariants

1. **Global Default Deny**: Every document not explicitly permitted is blocked from read, list, and write operations.
2. **Identity Integrity**: A client cannot create or modify resources pretending to be another user or inject unverified admin privileges.
3. **Immutability of Audit Trails**: Audit logs are append-only; updates and deletions are strictly forbidden for all accounts.
4. **Bootstrapped Admin Access**: Only authorized administrator credentials (`misterk1502@gmail.com` and administrative team with verified email) can modify CMS content, view global audit logs, and administer system settings.
5. **Quote Request Access**: Public visitors can submit quotes with valid constraints, but can only read their own submitted quotes via matching email/UID; administrative staff can manage quote statuses.
6. **ERP Tasks & Projects**: Internal operational resources are strictly restricted to authenticated staff with verified emails.
7. **Connection Diagnostic**: `/test/connection` read is permitted for client connection healthchecks.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Adversarial Payload 1 (Identity Spoofing on User Profile)**
   - *Attempt*: Regular user updates their own profile to inject `role: "admin_general"`.
   - *Expected*: `PERMISSION_DENIED`.

2. **Adversarial Payload 2 (Shadow Update / Ghost Field Injection)**
   - *Attempt*: User sends extra unwhitelisted field `isSuperAdmin: true` inside a Quote or Profile write.
   - *Expected*: `PERMISSION_DENIED`.

3. **Adversarial Payload 3 (Audit Log Modification / Deletion)**
   - *Attempt*: Attacker sends `delete` or `update` on `/audit_logs/{logId}`.
   - *Expected*: `PERMISSION_DENIED`.

4. **Adversarial Payload 4 (Oversized ID / ID Poisoning)**
   - *Attempt*: Attacker passes a 2KB junk character string as a document ID.
   - *Expected*: `PERMISSION_DENIED` (`isValidId()` constraint violation).

5. **Adversarial Payload 5 (Unauthenticated ERP Task Tampering)**
   - *Attempt*: Unauthenticated client attempts to create, edit, or delete an `/erp_tasks/{taskId}`.
   - *Expected*: `PERMISSION_DENIED`.

6. **Adversarial Payload 6 (Unverified Email Admin Spoofing)**
   - *Attempt*: Attacker creates an account with email `misterk1502@gmail.com` but `email_verified: false` and attempts admin writes.
   - *Expected*: `PERMISSION_DENIED`.

7. **Adversarial Payload 7 (Denial of Wallet / String Flooding)**
   - *Attempt*: User attempts to submit a Quote with a 50MB title or description.
   - *Expected*: `PERMISSION_DENIED` (`maxLength` and `size() <= 2000` violation).

8. **Adversarial Payload 8 (CMS Content Tampering by Visitor)**
   - *Attempt*: Visitor attempts to update `/cms_sections/{sectionId}`.
   - *Expected*: `PERMISSION_DENIED`.

9. **Adversarial Payload 9 (Quote Status Terminal Override)**
   - *Attempt*: Regular user attempts to change status of an approved or rejected quote directly.
   - *Expected*: `PERMISSION_DENIED`.

10. **Adversarial Payload 10 (Client Blanket Read Scraping)**
    - *Attempt*: Authenticated non-admin attempts blanket listing of all user profiles in `/users`.
    - *Expected*: `PERMISSION_DENIED`.

11. **Adversarial Payload 11 (Audit Log Timestamp Spoofing)**
    - *Attempt*: Client injects artificial backdated timestamp rather than valid system timestamp string.
    - *Expected*: `PERMISSION_DENIED`.

12. **Adversarial Payload 12 (Cross-User Quote Reading)**
    - *Attempt*: User A requests document `/quotes/{quoteId}` belonging to User B.
    - *Expected*: `PERMISSION_DENIED`.
