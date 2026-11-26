import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const roots=['js/shared','js/services','js/admin','js/portal'];
const files=roots.flatMap(root=>readdirSync(root,{withFileTypes:true})
  .filter(entry=>entry.isFile()&&entry.name.endsWith('.js'))
  .map(entry=>join(root,entry.name).replaceAll('\\','/'))
  .sort());
const stateUsage=new Map();
const serviceUsage=new Map();
const reassignedFunctions=[];
const directFirestore=[];
const areaSummary={};

for(const file of files){
  const source=readFileSync(file,'utf8');
  const area=file.split('/')[1];
  areaSummary[area]=(areaSummary[area]||0)+1;
  for(const match of source.matchAll(/\bstate(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)){
    const key=match[1],after=source.slice(match.index+match[0].length);
    const writes=/^\s*(?:\+\+|--|(?:\|\|=|&&=|\?\?=|=(?!=)))/.test(after);
    const row=stateUsage.get(key)||{reads:0,writes:0,readers:new Set(),writers:new Set()};
    if(writes){row.writes++;row.writers.add(file)}else{row.reads++;row.readers.add(file)}
    stateUsage.set(key,row);
  }
  for(const match of source.matchAll(/(?:window\.)?OleiroServices(?:\?\.)?\.([A-Za-z_$][\w$]*)/g)){
    const name=match[1],row=serviceUsage.get(name)||new Set();row.add(file);serviceUsage.set(name,row);
  }
  for(const match of source.matchAll(/(?:^|\n)\s*(?:window\.)?([A-Za-z_$][\w$]*)\s*=\s*function/g)){
    reassignedFunctions.push({file,symbol:match[1]});
  }
  if(area==='admin'||area==='portal'){
    if(/\b(?:getFirestore|initializeFirestore)\s*\(|\bfirestore\.(?:getDocs|getDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|collection|doc)\s*\(|\bdb\.(?:collection|doc)\s*\(/.test(source)){
      directFirestore.push(file);
    }
  }
}
function scriptOrder(htmlPath){
  const html=readFileSync(htmlPath,'utf8');
  return [...html.matchAll(/<script[^>]+src=["']([^"']+)/g)].map(match=>match[1]);
}
const stateRows=[...stateUsage.entries()].map(([key,row])=>({
  key,reads:row.reads,writes:row.writes,
  readers:[...row.readers].sort(),writers:[...row.writers].sort()
})).sort((a,b)=>b.writers.length-a.writers.length||b.readers.length-a.readers.length||a.key.localeCompare(b.key));
const serviceRows=[...serviceUsage.entries()].map(([service,owners])=>({service,owners:[...owners].sort()})).sort((a,b)=>a.service.localeCompare(b.service));
const multiWriter=stateRows.filter(row=>row.writers.length>1);
const report={
  summary:{files:files.length,byArea:areaSummary,stateKeys:stateRows.length,stateKeysWithMultipleWriters:multiWriter.length,globalFunctionAssignments:reassignedFunctions.length,screenModulesWithDirectFirestore:directFirestore.length},
  entryPoints:{admin:scriptOrder('admin/index.html'),portal:scriptOrder('portal/index.html')},
  state:{multiWriter,mostShared:stateRows.slice(0,40)},
  services:serviceRows,
  globalFunctionAssignments:reassignedFunctions,
  directFirestore
};
console.log(JSON.stringify(report,null,2));
