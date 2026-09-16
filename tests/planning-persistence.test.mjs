import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('editing legacy sessions preserves status and inserts new occurrences as proposed',async()=>{
  for(const status of ['proposed','plan_approved','confirmed']){
    const writes=[];
    const firestore={doc:(...args)=>({id:args.length===1?'new-session':args.at(-1)}),collection:()=>({}),serverTimestamp:()=>1,writeBatch:()=>({update:(ref,patch)=>writes.push({kind:'update',ref,patch}),set:(ref,patch)=>writes.push({kind:'set',ref,patch}),delete:()=>{},commit:async()=>{}})};
    const window={OleiroServices:{run:fn=>fn(),firebase:async()=>({db:{},modules:{firestore}})}};
    runInNewContext(readFileSync('js/services/planning-service.js','utf8'),{window});
    const result=await window.OleiroServices.planning.saveActivity({activityId:'activity',applicationId:'app',unitId:'unit',createdByUid:'candidate',data:{name:'Edited'},dates:['2026-09-16','2026-09-17'],existingSessions:[{id:'legacy',activityId:'activity',date:'2026-09-16',status}]});
    const existing=writes.find(row=>row.ref.id==='legacy');
    assert.equal('status' in existing.patch,false);
    assert.equal(result.sessions[0].status,status);
    assert.equal(writes.find(row=>row.kind==='set').patch.status,'proposed');
  }
});

test('pure candidate rules distinguish editable planning from approved and meeting',()=>{
  const window={};runInNewContext(readFileSync('js/shared/domain-rules.js','utf8'),{window});
  for(const value of ['draft','submitted','adjustments'])assert.equal(window.OleiroRules.candidatePlanningEditable(value),true);
  for(const value of ['approved','meeting','rejected'])assert.equal(window.OleiroRules.candidatePlanningEditable(value),false);
});


test('legacy plan_approved sessions remain eligible for application-scoped adjustments',()=>{
  const source=readFileSync('js/portal/review-flow.js','utf8');
  assert.doesNotMatch(source,/row\.status==='plan_approved'\|\|row\.adminAdjustmentStatus!=='requested'/);
  assert.doesNotMatch(source,/adminAdjustmentStatus==='requested'&&row\.status!=='plan_approved'/);
  assert.match(source,/row\.status==='plan_approved'&&!candidateWorkflowOpen/);
});
