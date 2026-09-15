import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('admin browser cache cannot cross users or permission scopes',()=>{
  const source=readFileSync('js/admin/app.js','utf8').split('function managerDatePlusDays')[0];
  const storage=new Map();
  const state={role:'manager',currentSession:{uid:'a',user:{role:'admin',unitIds:['rodeio']}}};
  const context={state,_oleiroToday:'2026-09-15',sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}};
  runInNewContext(source,context);
  context.writeManagerBrowserCache({scheduleRows:[{id:'private'}]});assert.equal(context.readManagerBrowserCache().scheduleRows[0].id,'private');
  state.currentSession.uid='b';assert.equal(context.readManagerBrowserCache(),null);
  context.writeManagerBrowserCache({scheduleRows:[]});state.currentSession.user.role='coordinator';assert.equal(context.readManagerBrowserCache(),null);
  context.writeManagerBrowserCache({scheduleRows:[]});state.currentSession.user.unitIds=['indaial'];assert.equal(context.readManagerBrowserCache(),null);
  state.currentSession=null;context.writeManagerBrowserCache({scheduleRows:[]});assert.equal(context.readManagerBrowserCache(),null);
});
