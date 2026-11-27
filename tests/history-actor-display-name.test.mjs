import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('history records a display name from the authenticated profile and keeps email separately', async () => {
  const service = await read('../js/services/history-service.js');
  assert.ok(service.includes('profile=session?.profile||{}'));
  assert.ok(service.includes('profile.displayName||profile.fullName||profile.name'));
  assert.ok(service.includes('actorEmail:String(session?.email||user.email'));
  assert.ok(service.includes("?'Luan':'')"));
});

test('both Admin history views render display names and resolve legacy authors by UID', async () => {
  const modal = await read('../js/admin/history.js');
  const page = await read('../js/admin/account-history.js');
  assert.ok(modal.includes("actor=String(row.actorLabel||'').trim()"));
  assert.ok(modal.includes("!actor.includes('@')"));
  assert.ok(page.includes('function historyAuthor(row)'));
  assert.ok(page.includes('async function resolveHistoryActors(rows)'));
  assert.ok(page.includes('OleiroServices.users.getByIds(uids)'));
  assert.ok(page.includes('row.actorLabel=actor.name'));
});

test('legacy author resolution tolerates denied volunteer profile reads', async () => {
  const users = await read('../js/services/user-service.js');
  assert.ok(users.includes("async getByIds(uids)"));
  assert.ok(users.includes("async getByEmails(emails)"));
  assert.ok(users.includes(".catch(error=>{console.warn('Perfil complementar indisponível:'"));
  assert.ok(users.includes("profileSnapshots[index]?.exists()"));
});

test('history never renders an email address as the author display name', async () => {
  const page = await read('../js/admin/account-history.js');
  const modal = await read('../js/admin/history.js');
  assert.ok(page.includes("return 'Autor não registrado'"));
  assert.ok(!page.includes("if(email)return email"));
  assert.ok(modal.includes("actor&&!actor.includes('@')"));
});

test('admin account uses the standard logout confirmation and a full-width footer action', async () => {
  const account = await read('../js/admin/account-settings.js');
  assert.ok(account.includes("window.confirmAdminLogout=function()"));
  assert.ok(account.includes("'Sair do portal'"));
  assert.ok(account.includes("'Deseja realmente encerrar sua sessão?'"));
  assert.ok(account.includes("onclick=\"confirmAdminLogout()\""));
  assert.ok(account.includes("window.OleiroAuth.signOut()"));
  assert.ok(account.includes("grid-template-columns:1fr;padding-top:12px"));
  assert.ok(account.includes(".admin-account-footer .admin-account-inline-signout{width:100%"));
});
