import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('history events persist the authenticated email and render it as the author', async () => {
  const service = await read('../js/services/history-service.js');
  const history = await read('../js/admin/account-history.js');
  const applications = await read('../js/services/application-service.js');
  assert.match(service, /actorEmail:String\(session\?\.email\|\|user\.email\|\|''\)/);
  assert.match(history, /row\?\.actorEmail/);
  assert.match(applications, /async updateLifecycle/);
  assert.match(applications, /profile_inactivated/);
  assert.match(applications, /profile_reactivated/);
  assert.match(applications, /services\.history\.append\(id,eventType/);
});

test('WhatsApp sharing is disabled without active sessions and does not open a blank tab', async () => {
  const planning = await read('../js/portal/planejamento.js');
  assert.match(planning, /const hasActive=activeCandidateSessions\(\)\.length>0/);
  assert.match(planning, /disabled aria-disabled="true"/);
  assert.match(planning, /window\.location\.assign\(url\)/);
  assert.doesNotMatch(planning, /window\.open\(url/);
});

test('inactive volunteer account details stop loading access records and show a skeleton for pending reads', async () => {
  const details = await read('../js/admin/candidate-detail-data.js');
  assert.match(details, /oleiro-skeleton/);
  assert.match(details, /p\.inactive===true\|\|p\.active===false\|\|p\.status==='rejected'/);
  assert.match(details, /finally\{state\.adminAccountReadAt\[key\]=Date\.now\(\)\}/);
  assert.match(details, /Acesso inativo/);
});

test('admin version panel removes the details link and waits for authenticated home before announcement', async () => {
  const release = await read('../js/admin/release-notes.js');
  assert.doesNotMatch(release, /Ver detalhes/);
  assert.match(release, /if\(state\?\.managerPage==='home'\)\{maybeAnnounce\(\)/);
  assert.match(release, /if\(popupOpened\|\|seen\(\)\)return/);
  assert.ok(release.includes("const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-')"));
  assert.match(release, /const automatedBrowser=typeof navigator!=='undefined'&&navigator\.webdriver===true/);
  const notes = JSON.parse(await read('../release-notes.json'));
  assert.equal(notes.releases[0].version, '383');
  assert.ok(notes.releases[0].audience.includes('admin'));
  assert.ok(notes.releases[0].audience.includes('volunteer'));
});

test('project read permissions remain scoped to active users and their own project IDs', async () => {
  const rules = await read('../firestore.rules');
  assert.match(rules, /match \/legacy_projects\/\{projectId\}/);
  assert.match(rules, /activeUser\(\) && projectId\.matches\('\.\*__' \+ request\.auth\.uid\)/);
  assert.match(rules, /allow delete: if false/);
});
