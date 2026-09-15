import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('outer navigation wrapper prevents render, reads and motion for current route/tab',()=>{
  const source=readFileSync('js/shared/smart-interactions.js','utf8');
  const block=source.slice(source.indexOf('  function wrap('),source.indexOf('  /* Modais:'));
  let calls=0,motions=0;
  const state={role:'manager',managerPage:'planning',volunteerPage:'plan',managerPlanningPersonId:'a',managerPlanningTab:'history'};
  const window={OleiroUI:{}};
  for(const name of ['navigateManager','navigateVolunteer','goHome','openManagerOccupancy','openPerson'])window[name]=()=>{calls++};
  runInNewContext(block,{window,state,beginNavigation:()=>{motions++},scheduleMotion:()=>{motions++},saveCurrentScroll:()=>{},requestAnimationFrame:()=>{},pendingMotion:null});
  window.navigateManager('planning');window.navigateVolunteer('plan');window.openPerson('a','history');
  assert.equal(calls,0);assert.equal(motions,0);
  window.navigateManager('groups');assert.equal(calls,1);assert.equal(motions,2);
  state.managerPage='home';window.goHome();assert.equal(calls,1);
  state.managerPage='occupancy';window.openManagerOccupancy();assert.equal(calls,1);
});
