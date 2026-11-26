import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=path=>readFileSync(path,'utf8');

test('Admin WhatsApp eligibility is based on valid persisted sessions, not stale sessionCount',()=>{
  const source=read('js/admin/planning-page.js');
  assert.match(source,/function adminShareableRows\(rows\)/);
  assert.match(source,/refreshAdminShareEligibility\(p/);
  assert.match(source,/state\.adminShareEligibility\[id\]=result/);
  assert.doesNotMatch(source,/adminShareableSession\)\|\|Number\(p\?\.sessionCount\|\|0\)>0/);
  assert.match(source,/eligibility\?\.valid!==true/);
});

test('Admin WhatsApp button restores its WhatsApp icon after preparation and during cooldown',()=>{
  const source=read('js/admin/planning-page.js');
  assert.match(source,/const icon=button\.querySelector\('i'\);if\(icon\)icon\.className='fa-brands fa-whatsapp'/);
  assert.match(source,/button\.removeAttribute\('aria-busy'\)/);
  assert.match(source,/button\.classList\.toggle\('is-complete',status\.cooldownActive\)/);
});

test('Lifecycle audit uses a server read and invalidates both history caches after atomic commit',()=>{
  const source=read('js/services/application-service.js');
  assert.match(source,/getDocFromServer\|\|firestore\.getDoc/);
  assert.match(source,/services\.history\.appendToBatch\(batch,context,id,eventType/);
  assert.match(source,/window\.OleiroUI\?\.invalidateHistoryCache\?\.\(historyKey\)/);
});

test('History read failures are surfaced instead of silently appearing as an empty history',()=>{
  const source=read('js/services/history-service.js');
  assert.match(source,/Falha ao consultar o histórico persistido da candidatura/);
  assert.match(source,/getDocsFromServer\\|\\|firestore\\.getDocs/);
  assert.doesNotMatch(source,/fallback:true/);
});
