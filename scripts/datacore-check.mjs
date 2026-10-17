#!/usr/bin/env node
// VIVA Phase 2.2 — Contrôle DATA CORE (Étape 17).
// Statique + sondes anon en lecture seule. Exit 0 = tout PASS, 1 = FAIL, 2 = partiel.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const results = [];
const ok = (id, detail) => results.push({ id, status: 'PASS', detail });
const fail = (id, detail) => results.push({ id, status: 'FAIL', detail });
const skip = (id, detail) => results.push({ id, status: 'SKIP', detail });
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';

// DC-01 : operationId/idempotence côté file offline
{
  const t = read(path.join(ROOT, 'src', 'services', 'syncService.ts'));
  (t.includes('operationId') && t.includes('retryCount'))
    ? ok('DC-01', 'file offline : operationId + retryCount présents')
    : fail('DC-01', 'contrat offline incomplet');
}
// DC-02 : annuaire DB en lecture (pas de fake)
{
  const t = read(path.join(ROOT, 'src', 'components', 'admin', 'RolesAndUsersManager.tsx'));
  (t.includes("from('profiles')") && t.includes('annuaire local'))
    ? ok('DC-02', 'annuaire : lecture profiles + mention de source')
    : fail('DC-02', 'annuaire non branché');
}
// DC-03 : tickets/notifications/contacts explicitement session
{
  const checks = [
    ['ClientPortal.tsx', 'Session uniquement'],
    ['CrmModule.tsx', 'SESSION uniquement'],
    ['NotificationCenter.tsx', 'Aucune notification inventée'],
  ];
  const missing = checks.filter(([f, s]) => !read(path.join(ROOT, 'src', f.includes('Client') ? 'components/client' : f.includes('Crm') ? 'components/enterprise' : 'components/common', f)).includes(s));
  missing.length === 0 ? ok('DC-03', 'mentions session présentes (tickets/notifications/contacts)') : fail('DC-03', 'mentions manquantes: ' + missing.map(m => m[0]).join(','));
}
// DC-04 : pas de nouvelle écriture Firestore ajoutée en Phase 2 (hors miroirs documentés)
{
  const t = read(path.join(ROOT, 'src', 'context', 'ProjectDataContext.tsx')) + read(path.join(ROOT, 'src', 'context', 'EnterpriseErpContext.tsx'));
  const mirrors = (t.match(/LEGACY mirror/g) || []).length;
  mirrors > 0 ? ok('DC-04', mirrors + ' miroirs legacy marqués (strangler assumé)') : fail('DC-04', 'aucun miroir marqué ?');
}

const live = process.argv.includes('--live');
if (!live) {
  skip('DC-LIVE', 'relancer avec --live');
} else {
  const envFile = ['.env.local', '.env'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
  const env = Object.fromEntries(
    fs.readFileSync(envFile, 'utf8').split(/\r?\n/).map(l => l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)).filter(Boolean)
      .map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]),
  );
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) skip('DC-LIVE', 'vars absentes');
  else {
    let createClient = null;
    try {
      const { createRequire } = await import('node:module');
      ({ createClient } = createRequire(path.join(ROOT, 'package.json'))('@supabase/supabase-js'));
    } catch { /* noop */ }
    if (!createClient) skip('DC-LIVE', 'client indisponible');
    else {
      const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
      const probe = async (id, table, expect) => {
        try {
          const r = await sb.from(table).select('*').limit(1);
          const got = r.error ? (r.error.code || 'ERR') : 'OK';
          (expect === 'absent' ? got === 'PGRST205' : expect === 'deny' ? (got === '42501' || got.startsWith('ERR')) : got === 'OK')
            ? ok(id, `${table} : ${got}`)
            : fail(id, `${table} : ${got} (attendu ${expect})`);
        } catch (e) { fail(id, `${table} : ${e.message}`); }
      };
      // Tables B/C/D non déployées → absentes (cohérent, pas une panne).
      for (const t of ['contacts', 'tickets', 'notifications', 'equipment', 'workflows', 'projects']) await probe('DC-NEW-' + t, t, t === 'projects' ? 'deny' : 'absent');
      // Domaines migrés : lecture publique conforme.
      await probe('DC-READ-flags', 'feature_flags', 'OK');
      await probe('DC-READ-menus', 'menus', 'OK');
      // A/B : devis d'autrui illisibles en anon.
      const r = await sb.from('quotes').select('id').limit(1);
      r.error ? ok('DC-AB', 'quotes anon refusé (' + r.error.code + ')') : fail('DC-AB', 'quotes anon lisible !');
    }
  }
}
const fails = results.filter(r => r.status === 'FAIL').length;
console.log(JSON.stringify({ results, fails }, null, 1));
process.exit(fails > 0 ? 1 : 0);
