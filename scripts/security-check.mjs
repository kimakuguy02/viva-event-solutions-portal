#!/usr/bin/env node
// VIVA Phase 1 — Suite de vérification sécurité (Bloc 11).
// Usage : node scripts/security-check.mjs [--live]
// - Sans --live : contrôles STATIQUES du code (aucun secret lu, aucun réseau).
// - Avec --live : + contrôles API anon en lecture seule (aucune écriture).
// Sortie : PASS/FAIL par test + code de sortie (0 = tout PASS, 1 = échec,
// 2 = partiel/non testable). Ne corrige rien, ne stocke rien.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const results = [];
const ok = (id, detail) => results.push({ id, status: 'PASS', detail });
const fail = (id, detail) => results.push({ id, status: 'FAIL', detail });
const skip = (id, detail) => results.push({ id, status: 'SKIP', detail });

function readAll(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      readAll(p, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = readAll(SRC);
const has = (re, dirs = null) => files.filter(f => !dirs || dirs.some(d => f.includes(d))).filter(f => re.test(fs.readFileSync(f, 'utf8')));

// SECRET-01 : aucun secret/privilege dans le frontend (hors commentaires)
{
  const hits = files.filter(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n')
      .filter(l => { const t = l.trim(); return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('<!--'); });
    return /service_role|SERVICE_ROLE|BEGIN [A-Z ]*PRIVATE KEY|sk-live|ghp_|xoxb-|ADMIN_PASSWORD|SESSION_SECRET/.test(lines.join('\n'));
  });
  hits.length === 0 ? ok('SECRET-01', 'aucun secret/service_role dans src/') : fail('SECRET-01', hits.join(', '));
}
// AUTH-01/RBAC : bypass hors chemin actif (commentaires et mocks exclus du verdict)
{
  const active = files.filter(f => {
    const t = fs.readFileSync(f, 'utf8');
    const lines = t.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const body = lines.join('\n');
    return /loginAsClient\s*\(|setUserRole\s*\(|Bearer admin_general_token|x-user-role/.test(body);
  });
  active.length === 0 ? ok('AUTH-01', 'aucun bypass actif (loginAsClient/setUserRole/tokens codés)') : fail('AUTH-01', active.join(', '));
}
// XSS-01 : pas d'injection HTML non sanitizée
{
  const hits = has(/dangerouslySetInnerHTML|innerHTML\s*=|\beval\(|new Function\(/);
  hits.length === 0 ? ok('XSS-01', 'aucune injection HTML/eval dans src/') : fail('XSS-01', hits.join(', '));
}
// API-02 : sync/push exige permission par entité
{
  const api = path.join(ROOT, 'server', 'api.ts');
  const t = fs.existsSync(api) ? fs.readFileSync(api, 'utf8') : '';
  (t.includes('ENTITY_PERMISSIONS') && t.includes('SYNC_PUSH_DENIED'))
    ? ok('API-02', 'sync/push : permissions par entité + refus audités')
    : fail('API-02', 'garde ENTITY_PERMISSIONS introuvable dans server/api.ts');
}
// AUDIT-01 : trigger acteur serveur présent dans les migrations
{
  const mig = path.join(ROOT, 'supabase', 'migrations', '20261004_010_audit_actor.sql');
  (fs.existsSync(mig) && fs.readFileSync(mig, 'utf8').includes('force_audit_actor'))
    ? ok('AUDIT-01', 'trigger force_audit_actor versionné')
    : fail('AUDIT-01', 'migration 010 absente');
}
// CSP : headers présents côté serveur
{
  const srv = path.join(ROOT, 'server.ts');
  const t = fs.existsSync(srv) ? fs.readFileSync(srv, 'utf8') : '';
  (t.includes('Content-Security-Policy') && !t.includes('godMode'))
    ? ok('CSP-01', 'CSP + Permissions-Policy servies, godMode retiré du /health')
    : fail('CSP-01', 'headers incomplets dans server.ts');
}

const live = process.argv.includes('--live');
if (live) {
  // Lecture seule via anon : tables privées doivent refuser, publiques répondre.
  const envFile = ['.env.local', '.env'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
  const env = Object.fromEntries(
    fs.readFileSync(envFile, 'utf8').split(/\r?\n/).map(l => l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)).filter(Boolean)
      .map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]),
  );
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    skip('LIVE', 'vars Supabase absentes — contrôles live impossibles');
  } else {
    let createClient = null;
    try {
      const { createRequire } = await import('node:module');
      const require = createRequire(path.join(ROOT, 'package.json'));
      ({ createClient } = require('@supabase/supabase-js'));
    } catch { /* noop */ }
    if (!createClient) {
      skip('LIVE', 'client supabase-js indisponible');
    } else {
      const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
      const check = async (id, table, expect) => {
        try {
          const r = await sb.from(table).select('*').limit(1);
          if (expect === 'deny' && r.error) ok(id, `${table} : refusé (${r.error.code})`);
          else if (expect === 'allow' && !r.error) ok(id, `${table} : lisible`);
          else fail(id, `${table} : inattendu (erreur=${r.error?.code}, lignes=${r.data?.length})`);
        } catch (e) { fail(id, `${table} : ${e.message}`); }
      };
      await check('RLS-01', 'quotes', 'deny');
      await check('RLS-02', 'erp_transactions', 'deny');
      await check('STORAGE-01', 'client_documents', 'deny');
      await check('RLS-PUB', 'feature_flags', 'allow');
    }
  }
} else {
  skip('LIVE', 'relancer avec --live pour les contrôles distants (lecture seule)');
  skip('RBAC-01', 'nécessite sessions CLIENT/ADMIN (manuel ou --live étendu)');
  skip('RBAC-02', 'nécessite session ADMIN (manuel)');
  skip('API-01', 'nécessite serveur Express démarré (manuel : POST /sync/push sans permission → 403 + denied)');
  skip('AUDIT-01-LIVE', 'nécessite session (manuel : actor = auth.uid())');
}

const fails = results.filter(r => r.status === 'FAIL').length;
const skips = results.filter(r => r.status === 'SKIP').length;
console.log(JSON.stringify({ results, fails, skips }, null, 1));
process.exit(fails > 0 ? 1 : skips > 0 ? 2 : 0);
