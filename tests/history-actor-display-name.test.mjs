import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('history records the authenticated user display name, not their email', async () => {
  const service = await read('../js/services/history-service.js');
  assert.match(service, /actorLabel:String\(user\.displayName\|\|user\.name\|\|session\?\.displayName\|\|session\?\.name\|\|''\)/);
  assert.match(service, /actorEmail:String\(session\?\.email\|\|user\.email/);
});

test('both Admin history views prefer display names and resolve legacy email labels by UID', async () => {
  const modal = await read('../js/admin/history.js');
  const page = await read('../js/admin/account-history.js');
  assert.match(modal, /row\.actorLabel\|\|row\.actorEmail/);
  assert.match(page, /function historyAuthor\(row\)/);
  assert.match(page, /actorLabel\|\|''\)\.trim\(\)\.toLowerCase\(\)===String\(row\.actorEmail/);
  assert.match(page, /OleiroServices\.users\.getByIds\(uids\)/);
  assert.match(page, /actor\.name\)row\.actorLabel=actor\.name/);
});
