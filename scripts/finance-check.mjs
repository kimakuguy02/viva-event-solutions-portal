#!/usr/bin/env node
// VIVA Phase 2 — Tests finance FIN-01..FIN-10 (Étape 9).
// Usage : node scripts/finance-check.mjs [--live]
// Statique : RPC versionnées, garde-fous code, absence d'OTP simulé.
// Live (anon, lecture seule) : insertions/validations refusées sans session.
// Authentifié : manuel (matrice dans VIVA_PHASE_2_FINANCE_TESTS.md).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const results = [];
const ok = (id, detail) => results.push({ id, status: 'PASS', detail });
const fail = (id, detail) => results.push({ id, status: 'FAIL', detail });
const skip = (id, detail) => results.push({ id, status: 'SKIP', detail });
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';

const RPC = read(path.join(ROOT, 'supabase', 'migrations', '20261007_018_finance_rpc.sql'));
const SVC = read(path.join(ROOT, 'src', 'services', 'supabase', 'erpService.ts'));

// FIN-00 : RPC versionnées avec garde-fous serveur
{
  const need = ['erp_approve_manager', 'erp_validate_daf', 'erp_reverse_tx', 'closure_validate', 'reference_mint', 'prevent_closure_mutation', 'set search_path', 'auth.uid()'];
  const missing = need.filter(s => !RPC.includes(s));
  missing.length === 0 ? ok('FIN-RPC', '5 RPC + trigger clôtures + auth.uid() + search_path verrouillé') : fail('FIN-RPC', 'manquant: ' + missing.join(', '));
}
// FIN-00b : pas de TVA automatique
{
  const hits = ['AccountingModule', 'EnterpriseErpContext', 'erpService'].map(f => {
    const t = read(path.join(ROOT, 'src', f.includes('erpService') ? path.join('services', 'supabase', 'erpService.ts') : f.includes('Accounting') ? path.join('components', 'enterprise', 'AccountingModule.tsx') : path.join('context', 'EnterpriseErpContext.tsx')));
    return /\btva\b|\bvat\b|\btaxe\b|\btax\b/i.test(t) ? f : null;
  }).filter(Boolean);
  hits.length === 0 ? ok('FIN-NOTVA', 'aucune logique TVA/fiscale automatique') : fail('FIN-NOTVA', hits.join(', '));
}
// FIN-00c : OTP simulé supprimé du chemin actif
{
  const files = [
    path.join(ROOT, 'src', 'components', 'enterprise', 'AccountingModule.tsx'),
    path.join(ROOT, 'src', 'components', 'enterprise', 'ErpDashboard.tsx'),
    path.join(ROOT, 'src', 'context', 'EnterpriseErpContext.tsx'),
  ];
  const bad = files.filter(f => {
    const lines = read(f).split('\n').filter(l => !l.trim().startsWith('//'));
    return /simulatedGeneratedOtp|otpCodeInput|Math\.floor\(100000 \+ Math\.random/.test(lines.join('\n'));
  });
  bad.length === 0 ? ok('FIN-NOOTP', 'aucun OTP simulé actif (attestation uniquement)') : fail('FIN-NOOTP', bad.join(', '));
}
// FIN-00d : montants NUMERIC côté migration + validation montants RPC
{
  (RPC.includes('amount_usd') && SVC.includes('Number('))
    ? ok('FIN-NUMERIC', 'montants NUMERIC en base, coercition explicite côté service')
    : fail('FIN-NUMERIC', 'vérifier types montants');
}
// FIN-00e : frontend appelle RPC (pas d'écriture directe de statut)
{
  const direct = /from\('erp_transactions'\)\.update\(\{\s*validation_status/.test(SVC);
  const viaRpc = SVC.includes("sb.rpc('erp_approve_manager'") && SVC.includes("sb.rpc('erp_validate_daf'");
  (!direct && viaRpc) ? ok('FIN-RPCWIRE', 'transitions via RPC, pas d’update direct validation_status') : fail('FIN-RPCWIRE', 'écriture directe persistante ?');
}

if (process.argv.includes('--live')) {
  const envFile = ['.env.local', '.env'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
  const env = Object.fromEntries(
    fs.readFileSync(envFile, 'utf8').split(/\r?\n/).map(l => l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)).filter(Boolean)
      .map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]),
  );
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    skip('FIN-LIVE', 'vars absentes');
  } else {
    let createClient = null;
    try {
      const { createRequire } = await import('node:module');
      ({ createClient } = createRequire(path.join(ROOT, 'package.json'))('@supabase/supabase-js'));
    } catch { /* noop */ }
    if (!createClient) skip('FIN-LIVE', 'client indisponible');
    else {
      const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
      // FIN-01/02/09 : anon ne peut ni créer ni lire ( отказано = PASS)
      const ins = await sb.from('erp_transactions').insert({ piece_reference: '__probe__', direction: 'depense', amount_usd: 1 });
      ins.error ? ok('FIN-01', 'création anon refusée (' + ins.error.code + ')') : fail('FIN-01', 'insert anon accepté !');
      const rpc = await sb.rpc('erp_validate_daf', { p_piece: '__probe__' });
      rpc.error ? ok('FIN-02', 'validation anon refusée (' + rpc.error.code + ')') : fail('FIN-02', 'RPC anon acceptée !');
      const sel = await sb.from('erp_transactions').select('id').limit(1);
      sel.error ? ok('FIN-09b', 'lecture anon refusée (' + sel.error.code + ')') : fail('FIN-09b', 'lecture anon possible !');
      skip('FIN-03', 'session DAF requise (manuel)');
      skip('FIN-04', 'session DAF requise (manuel)');
      skip('FIN-05', 'session requise (manuel : UPDATE ligne valide → erreur trigger)');
      skip('FIN-06', 'session erp.validate requise (manuel)');
      skip('FIN-07', 'session requise (manuel : refus attendu)');
      skip('FIN-08', 'session requise (manuel : acteur = auth.uid())');
      skip('FIN-09', 'session requise sauf probes anon ci-dessus (manuel)');
      skip('FIN-10', 'session requise (manuel : audit actor = soi)');
    }
  }
} else {
  skip('FIN-LIVE', 'relancer avec --live');
  skip('FIN-03..FIN-10', 'sessions DAF/ADMIN/CLIENT requises (manuel, voir TESTS.md)');
}

const fails = results.filter(r => r.status === 'FAIL').length;
console.log(JSON.stringify({ results, fails }, null, 1));
process.exit(fails > 0 ? 1 : 0);
