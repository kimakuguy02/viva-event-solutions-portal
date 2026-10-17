import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_PROJECTS, INITIAL_QUOTES, INITIAL_EQUIPMENT, INITIAL_PARTNERS } from '../src/data/vivaData';
import { INITIAL_CRM_CLIENTS, INITIAL_TRANSACTIONS, INITIAL_TASKS } from '../src/data/enterpriseErpData';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runMigration() {
  console.log('[MIGRATION] Starting idempotent migration to Firestore...');
  const dbPath = path.join(process.cwd(), 'data', 'viva_database.json');
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  const source = JSON.parse(rawData);

  let migratedCount = 0;

  // 1. Users (Sanitize: NEVER store password hash or salt in Firestore)
  if (Array.isArray(source.users)) {
    console.log(`[MIGRATION] Migrating ${source.users.length} users...`);
    for (const u of source.users) {
      const { passwordHash, passwordSalt, ...safeUser } = u;
      await setDoc(doc(db, 'users', safeUser.id), {
        ...safeUser,
        migratedAt: new Date().toISOString()
      }, { merge: true });
      migratedCount++;
    }
  }

  // 2. Organization Directions (9 Directions & sub-directions)
  if (Array.isArray(source.directionsOrg)) {
    console.log(`[MIGRATION] Migrating ${source.directionsOrg.length} organization directions...`);
    for (const d of source.directionsOrg) {
      await setDoc(doc(db, 'organization_directions', d.id), d, { merge: true });
      migratedCount++;
    }
  }

  // 3. Dynamic Menus
  if (Array.isArray(source.dynamicMenus)) {
    console.log(`[MIGRATION] Migrating ${source.dynamicMenus.length} dynamic menus...`);
    for (const m of source.dynamicMenus) {
      await setDoc(doc(db, 'dynamic_menus', m.id), m, { merge: true });
      migratedCount++;
    }
  }

  // 4. Dynamic Modules
  if (Array.isArray(source.dynamicModules)) {
    console.log(`[MIGRATION] Migrating ${source.dynamicModules.length} dynamic modules...`);
    for (const mod of source.dynamicModules) {
      await setDoc(doc(db, 'dynamic_modules', mod.id), mod, { merge: true });
      migratedCount++;
    }
  }

  // 5. CMS Sections
  if (Array.isArray(source.cmsSections)) {
    console.log(`[MIGRATION] Migrating ${source.cmsSections.length} CMS sections...`);
    for (const s of source.cmsSections) {
      await setDoc(doc(db, 'cms_sections', s.id), s, { merge: true });
      migratedCount++;
    }
  }

  // 6. Platform Config
  if (source.platformConfig) {
    console.log(`[MIGRATION] Migrating platform configuration...`);
    await setDoc(doc(db, 'platform_config', 'main'), source.platformConfig, { merge: true });
    migratedCount++;
  }

  // 7. Projects (Source + Initial baseline)
  const projectsList = (source.projects && source.projects.length > 0) ? source.projects : INITIAL_PROJECTS;
  console.log(`[MIGRATION] Migrating ${projectsList.length} projects...`);
  for (const prj of projectsList) {
    await setDoc(doc(db, 'projects', prj.id), {
      ...prj,
      migratedAt: new Date().toISOString()
    }, { merge: true });
    migratedCount++;
  }

  // 8. Quotes (Source + Initial baseline)
  const quotesList = (source.quotes && source.quotes.length > 0) ? source.quotes : INITIAL_QUOTES;
  console.log(`[MIGRATION] Migrating ${quotesList.length} quotes...`);
  for (const q of quotesList) {
    await setDoc(doc(db, 'quotes', q.id), {
      ...q,
      migratedAt: new Date().toISOString()
    }, { merge: true });
    migratedCount++;
  }

  // 9. Equipment Inventory
  const equipmentList = (source.equipment && source.equipment.length > 0) ? source.equipment : INITIAL_EQUIPMENT;
  console.log(`[MIGRATION] Migrating ${equipmentList.length} equipment items...`);
  for (const eq of equipmentList) {
    await setDoc(doc(db, 'equipment', eq.id), eq, { merge: true });
    migratedCount++;
  }

  // 10. Certified Partners
  const partnersList = (source.partners && source.partners.length > 0) ? source.partners : INITIAL_PARTNERS;
  console.log(`[MIGRATION] Migrating ${partnersList.length} partners...`);
  for (const p of partnersList) {
    await setDoc(doc(db, 'partners', p.id), p, { merge: true });
    migratedCount++;
  }

  // 11. ERP Transactions (SYSCOHADA)
  const txList = (source.erp?.transactions && source.erp.transactions.length > 0) ? source.erp.transactions : INITIAL_TRANSACTIONS;
  console.log(`[MIGRATION] Migrating ${txList.length} ERP transactions...`);
  for (const tx of txList) {
    await setDoc(doc(db, 'erp_transactions', tx.id), tx, { merge: true });
    migratedCount++;
  }

  // 12. CRM Clients
  const clientList = (source.erp?.crmClients && source.erp.crmClients.length > 0) ? source.erp.crmClients : INITIAL_CRM_CLIENTS;
  console.log(`[MIGRATION] Migrating ${clientList.length} CRM clients...`);
  for (const c of clientList) {
    await setDoc(doc(db, 'crm_clients', c.id), c, { merge: true });
    migratedCount++;
  }

  // 13. ERP Tasks
  const taskList = (source.erp?.tasks && source.erp.tasks.length > 0) ? source.erp.tasks : INITIAL_TASKS;
  console.log(`[MIGRATION] Migrating ${taskList.length} ERP tasks...`);
  for (const t of taskList) {
    await setDoc(doc(db, 'erp_tasks', t.id), t, { merge: true });
    migratedCount++;
  }

  // 14. Audit Logs
  if (Array.isArray(source.auditLogs)) {
    console.log(`[MIGRATION] Migrating ${source.auditLogs.length} audit logs...`);
    for (const log of source.auditLogs) {
      await setDoc(doc(db, 'audit_logs', log.id), log, { merge: true });
      migratedCount++;
    }
  }

  // Diagnostic connection ping
  await setDoc(doc(db, 'test', 'connection'), {
    status: 'online',
    lastSync: new Date().toISOString(),
    service: 'VIVA Event Solutions Firestore Database'
  }, { merge: true });

  console.log(`[MIGRATION SUCCESS] ${migratedCount} documents successfully migrated to Firestore!`);
}

runMigration().then(() => {
  console.log('[MIGRATION COMPLETE] Process exited cleanly.');
  process.exit(0);
}).catch(err => {
  console.error('[MIGRATION ERROR]', err);
  process.exit(1);
});
