import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../js/services/review-service.js',import.meta.url),'utf8');
function setup(user){
  const window={state:{currentSession:{uid:'test-user',user}},OleiroServices:{planning:{},applications:{}}};
  runInNewContext(source,{window,console,Date});
  return window.OleiroServices.accessScope;
}
const firestore={where:(field,op,value)=>({field,op,value})};

test('administrators retain global scope while coordinators are unit-filtered',()=>{
  const admin=setup({role:'admin',unitIds:['rodeio']});
  const adminConstraints=[];
  assert.equal(admin.applyUnitFilter(firestore,adminConstraints,'all'),true);
  assert.equal(adminConstraints.length,0);
  assert.equal(admin.applyUnitFilter(firestore,adminConstraints,'indaial'),true);
  assert.deepEqual([adminConstraints[0].field,adminConstraints[0].op,adminConstraints[0].value],['unitId','==','indaial']);

  const coordinator=setup({role:'coordinator',unitIds:['Rodeio']});
  const local=[];
  assert.equal(coordinator.applyUnitFilter(firestore,local,'all'),true);
  assert.deepEqual([local[0].field,local[0].op,local[0].value],['unitId','==','rodeio']);
  const foreign=[];
  assert.equal(coordinator.applyUnitFilter(firestore,foreign,'indaial'),false);
  assert.equal(foreign.length,0);
});
test('activity assistants fail closed without an assigned unit and cannot request a foreign unit',()=>{
  const assistant=setup({role:'activity_assistant',unitIds:['rodeio']});
  const local=[];
  assert.equal(assistant.applyUnitFilter(firestore,local,'all'),true);
  assert.equal(local[0].value,'rodeio');
  const foreign=[];
  assert.equal(assistant.applyUnitFilter(firestore,foreign,'indaial'),false);

  const unassigned=setup({role:'activity_assistant',unitIds:[]});
  const denied=[];
  assert.equal(unassigned.applyUnitFilter(firestore,denied,'all'),false);
  assert.equal(denied.length,0);
  assert.equal(unassigned.forceUnit(),'__no_assigned_unit__');
});
test('non-manager roles do not inherit unrestricted query scope',()=>{
  for(const user of [{role:'volunteer',unitIds:['rodeio']},{role:'unknown',unitIds:['rodeio']},{}]){
    const scope=setup(user);
    const constraints=[];
    assert.equal(scope.applyUnitFilter(firestore,constraints,'all'),false);
    assert.equal(constraints.length,0);
    assert.deepEqual(scope.unitIds(),[]);
  }
});
