import { access, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const renames=[
  ['js/portal/meeting-activity-r51.js','js/portal/meeting-activity.js'],
  ['js/portal/candidate-adjustment-r37.js','js/portal/candidate-adjustment.js'],
  ['js/services/history-hooks-r27.js','js/services/history-hooks.js'],
  ['js/services/selection-flow-r25-service.js','js/services/selection-flow-service.js'],
  ['js/admin/history-r27.js','js/admin/history.js'],
  ['js/admin/selection-flow-r25.js','js/admin/selection-flow.js'],
  ['js/admin/selection-ui-r27.js','js/admin/selection-ui.js'],
  ['js/portal/selection-flow-r25.js','js/portal/selection-flow.js'],
  ['js/services/planning-days-r17-service.js','js/services/planning-days-service.js'],
  ['js/admin/planning-days-r17.js','js/admin/planning-days.js'],
  ['js/portal/planning-days-r17.js','js/portal/planning-days.js'],
  ['js/services/consistency-r15-services.js','js/services/consistency-services.js'],
  ['js/admin/consistency-r15.js','js/admin/consistency.js'],
  ['js/portal/consistency-r15.js','js/portal/consistency.js'],
  ['js/admin/confirm-r15.js','js/admin/confirmation.js']
];

async function exists(target){try{await access(target);return true}catch{return false}}

// meeting-activity.js no Admin já foi criado semanticamente para remover um loader morto.
if(await exists('js/admin/meeting-activity-r52.js'))await rm('js/admin/meeting-activity-r52.js');

for(const [from,to] of renames){
  if(!(await exists(from)))continue;
  if(await exists(to))throw new Error(`Destino já existe: ${to}`);
  await rename(from,to);
}

const replacements=new Map([
  ['meeting-activity-r52.js','meeting-activity.js'],
  ['meeting-activity-r51.js','meeting-activity.js'],
  ['candidate-adjustment-r37.js','candidate-adjustment.js'],
  ['history-hooks-r27.js','history-hooks.js'],
  ['selection-flow-r25-service.js','selection-flow-service.js'],
  ['history-r27.js','history.js'],
  ['selection-flow-r25.js','selection-flow.js'],
  ['selection-ui-r27.js','selection-ui.js'],
  ['planning-days-r17-service.js','planning-days-service.js'],
  ['planning-days-r17.js','planning-days.js'],
  ['consistency-r15-services.js','consistency-services.js'],
  ['consistency-r15.js','consistency.js'],
  ['confirm-r15.js','confirmation.js'],
  ['candidateAdjustmentR37','candidateAdjustment'],
  ['meetingActivityR54','meetingActivity']
]);

const textExtensions=new Set(['.html','.js','.mjs','.css','.json','.md','.yml','.yaml']);
const skipDirs=new Set(['.git','node_modules','site-dist','playwright-report','test-results']);
async function walk(dir='.'){
  const entries=await readdir(dir,{withFileTypes:true});
  const files=[];
  for(const entry of entries){
    const target=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(skipDirs.has(entry.name))continue;
      files.push(...await walk(target));
    }else if(textExtensions.has(path.extname(entry.name)))files.push(target);
  }
  return files;
}
for(const file of await walk()){
  let source=await readFile(file,'utf8'),next=source;
  for(const [from,to] of replacements)next=next.split(from).join(to);
  if(next!==source)await writeFile(file,next,'utf8');
}

// Fortalece a regra para os nomes históricos que já foram eliminados.
const checker='scripts/check-homologation-architecture.mjs';
let architecture=await readFile(checker,'utf8');
const anchor="'css/planning-person-agenda-r66.css'";
const retired=[
  'css/desktop-r49.css','js/admin/meeting-activity-r52.js','js/portal/meeting-activity-r51.js',
  'js/portal/candidate-adjustment-r37.js','js/services/history-hooks-r27.js',
  'js/services/selection-flow-r25-service.js','js/admin/history-r27.js','js/admin/selection-flow-r25.js',
  'js/admin/selection-ui-r27.js','js/portal/selection-flow-r25.js','js/services/planning-days-r17-service.js',
  'js/admin/planning-days-r17.js','js/portal/planning-days-r17.js','js/services/consistency-r15-services.js',
  'js/admin/consistency-r15.js','js/portal/consistency-r15.js','js/admin/confirm-r15.js'
];
if(architecture.includes(anchor)){
  architecture=architecture.replace(anchor,[anchor,...retired.map(item=>`'${item}'`)].join(','));
  await writeFile(checker,architecture,'utf8');
}

console.log('Semantic legacy renames applied:',renames.length+2);
