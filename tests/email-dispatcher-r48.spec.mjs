import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMode,notificationPlan,renderMessage,resolveRecipients} from '../workers/email-dispatcher/src/index.js';

test('EMAIL_MODE defaults safely to off',()=>{
  assert.equal(normalizeMode(), 'off');
  assert.equal(normalizeMode('something-else'), 'off');
  assert.equal(normalizeMode('TEST'), 'test');
});

test('planning submissions notify management',()=>{
  assert.deepEqual(notificationPlan({type:'planning_submitted'},{status:'analysis'}),{audience:'management'});
  assert.deepEqual(notificationPlan({type:'planning_resent'},{status:'analysis'}),{audience:'management'});
});

test('activity creation only notifies management after approval',()=>{
  assert.equal(notificationPlan({type:'activity_created'},{status:'pending'}),null);
  assert.deepEqual(notificationPlan({type:'activity_created'},{status:'approved'}),{audience:'management',reason:'post_approval_activity'});
});

test('approved activity edit requires explicit review-request metadata',()=>{
  assert.equal(notificationPlan({type:'activity_updated',metadata:{}},{status:'approved'}),null);
  assert.deepEqual(notificationPlan({type:'activity_updated',metadata:{reviewRequest:true}},{status:'approved'}),{audience:'management',reason:'post_approval_change'});
});

test('candidate meeting message includes date/time and escapes content',()=>{
  const msg=renderMessage({type:'meeting_scheduled',metadata:{date:'2026-09-10',time:'14:30'}},{participantNames:['Ana <script>']},'candidate');
  assert.match(msg.text,/10\/09\/2026/);
  assert.match(msg.text,/14:30/);
  assert.doesNotMatch(msg.html,/<script>/);
  assert.match(msg.html,/Ana &lt;script&gt;/);
});

test('test mode never uses real recipients',()=>{
  const recipients=resolveRecipients('test','candidate',{participantEmails:['real@example.com']},{TEST_EMAIL:'safe@example.com'});
  assert.deepEqual(recipients,['safe@example.com']);
});

test('production candidate recipients are deduplicated',()=>{
  const recipients=resolveRecipients('production','candidate',{participantEmails:['ONE@example.com','one@example.com'],email:'two@example.com'},{});
  assert.deepEqual(recipients,['one@example.com','two@example.com']);
});
