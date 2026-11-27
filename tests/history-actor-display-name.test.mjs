import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('history records the authenticated user display name, not their email', async () => {
  const service = await read('../js/services/history-service.js');
  assert.ok(service.includes("actorLabel:String(user.displayName||user.name||session?.displayName||session?.name||'')"));
  assert.ok(service.includes('actorEmail:String(session?.email||user.email'));
});

test('both Admin history views prefer display names and resolve legacy email labels by UID', async () => {
  const modal = await read('../js/admin/history.js');
  const page = await read('../js/admin/account-history.js');
  assert.ok(modal.includes('row.actorLabel||row.actorEmail'));
  assert.ok(page.includes('function historyAuthor(row)'));
  assert.ok(page.includes('async function resolveHistoryActors(rows)'));
  assert.ok(page.includes('OleiroServices.users.getByIds(uids)'));
  assert.ok(page.includes('row.actorLabel=actor.name'));
});

test('history resolves legacy authors by email and never exposes email as author label', async () => {
  const users = await read('../js/services/user-service.js');
  const page = await read('../js/admin/account-history.js');
  const modal = await read('../js/admin/history.js');
  assert.ok(users.includes('async getByEmails(emails)'));
  assert.ok(page.includes('users.getByEmails(emails)'));
  assert.ok(modal.includes('users.getByEmails(emails)'));
  assert.ok(page.includes("return 'Autor não registrado'"));
  assert.ok(!page.includes("if(email)return email"));
});
