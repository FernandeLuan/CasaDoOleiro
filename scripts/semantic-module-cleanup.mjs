import {existsSync,readFileSync,writeFileSync,renameSync,readdirSync,statSync} from 'node:fs';
import {join,extname} from 'node:path';

const mappings=[
  ['js/admin/approved-lifecycle-r18.js','js/admin/approved-lifecycle.js'],
  ['js/admin/refactor-r18.js','js/admin/candidate-detail-data.js'],
  ['js/admin/refinements-r19.js','js/admin/candidate-profile-details.js'],
  ['js/admin/refinements-r20.js','js/admin/candidate-planning-management.js'],
  ['js/admin/refinements-r23.js','js/admin/planning-review-controls.js'],
  ['js/admin/ux-r16.js','js/admin/admin-ux.js'],
  ['js/portal/candidate-refactor-r18.js','js/portal/candidate-view.js'],
  ['js/portal/refinements-r20.js','js/portal/planning-enhancements.js'],
  ['js/portal/refinements-r23.js','js/portal/review-safeguards.js'],
  ['js/portal/ux-r16.js','js/portal/portal-ux.js'],
  ['js/portal/review-flow-r31.js','js/portal/session-review-ui.js'],
  ['js/services/planning-r22-service.js','js/services/planning-operations-service.js'],
  ['js/shared/i18n-r25.js','js/shared/i18n-flow-compat.js'],
  ['js/shared/i18n-r27.js','js/shared/i18n-keyed.js']
];

for(const [oldPath,newPath] of mappings){
  if(!existsSync(oldPath))throw new Error(`Legacy module missing before migration: ${oldPath}`);
  if(existsSync(newPath))throw new Error(`Canonical target already exists: ${newPath}`);
  renameSync(oldPath,newPath);
}

const textExtensions=new Set(['.js','.mjs','.html','.yml','.yaml','.json','.md']);
const skip=new Set([
  'scripts/semantic-module-cleanup.mjs',
  '.github/workflows/one-time-semantic-module-cleanup.yml',
  'scripts/check-homologation-architecture.mjs'
]);
function filesUnder(root){
  if(!existsSync(root))return [];
  const out=[];
  for(const name of readdirSync(root)){
    const path=join(root,name),stat=statSync(path);
    if(stat.isDirectory())out.push(...filesUnder(path));
    else if(textExtensions.has(extname(path)))out.push(path);
  }
  return out;
}
const files=['index.html','admin/index.html','portal/index.html',...filesUnder('js'),...filesUnder('.github/workflows'),...filesUnder('tests'),...filesUnder('scripts')]
  .filter((value,index,array)=>array.indexOf(value)===index&&!skip.has(value));

const adminBase=new Map(mappings.filter(([oldPath])=>oldPath.startsWith('js/admin/')).map(([oldPath,newPath])=>[oldPath.split('/').at(-1),newPath.split('/').at(-1)]));
const portalBase=new Map(mappings.filter(([oldPath])=>oldPath.startsWith('js/portal/')).map(([oldPath,newPath])=>[oldPath.split('/').at(-1),newPath.split('/').at(-1)]));
const uniqueBase=new Map();
for(const [oldPath,newPath] of mappings){
  const oldBase=oldPath.split('/').at(-1),newBase=newPath.split('/').at(-1);
  if(!mappings.some(([other])=>other!==oldPath&&other.endsWith('/'+oldBase)))uniqueBase.set(oldBase,newBase);
}

for(const file of files){
  if(!existsSync(file))continue;
  let source=readFileSync(file,'utf8'),next=source;
  for(const [oldPath,newPath] of mappings){
    next=next.split(oldPath).join(newPath);
    next=next.split('../'+oldPath).join('../'+newPath);
  }
  if(file.startsWith('js/admin/'))for(const [oldBase,newBase] of adminBase)next=next.split(oldBase).join(newBase);
  if(file.startsWith('js/portal/'))for(const [oldBase,newBase] of portalBase)next=next.split(oldBase).join(newBase);
  for(const [oldBase,newBase] of uniqueBase)next=next.split(oldBase).join(newBase);
  if(next!==source)writeFileSync(file,next);
}

const checker='scripts/check-homologation-architecture.mjs';
let check=readFileSync(checker,'utf8');
const forbiddenAnchor="'js/services/review-flow-r31-service.js'";
if(!check.includes(forbiddenAnchor))throw new Error('Architecture forbidden-list anchor missing.');
const oldPaths=mappings.map(([oldPath])=>`'${oldPath}'`).join(',');
if(!check.includes("'js/admin/refactor-r18.js'"))check=check.replace(forbiddenAnchor,`${forbiddenAnchor},${oldPaths}`);
const requiredAnchor="'css/planning-person-agenda.css'";
if(!check.includes(requiredAnchor))throw new Error('Architecture required-list anchor missing.');
const newPaths=mappings.map(([,newPath])=>`'${newPath}'`).join(',');
if(!check.includes("'js/admin/candidate-detail-data.js'"))check=check.replace(requiredAnchor,`${requiredAnchor},${newPaths}`);
writeFileSync(checker,check);

for(const [oldPath,newPath] of mappings){
  if(existsSync(oldPath))throw new Error(`Legacy module still exists: ${oldPath}`);
  if(!existsSync(newPath))throw new Error(`Canonical module missing: ${newPath}`);
}

const scanFiles=['index.html','admin/index.html','portal/index.html','.github/workflows/real-data-ci.yml',...filesUnder('js')];
for(const file of scanFiles){
  const source=readFileSync(file,'utf8');
  for(const [oldPath] of mappings){
    const oldBase=oldPath.split('/').at(-1);
    if(source.includes(oldPath)||source.includes('../'+oldPath))throw new Error(`${file}: legacy path reference remains: ${oldPath}`);
    if(file.startsWith('js/admin/')&&oldPath.startsWith('js/admin/')&&source.includes(oldBase))throw new Error(`${file}: legacy admin basename remains: ${oldBase}`);
    if(file.startsWith('js/portal/')&&oldPath.startsWith('js/portal/')&&source.includes(oldBase))throw new Error(`${file}: legacy portal basename remains: ${oldBase}`);
  }
}

console.log(`Semantic module cleanup complete: ${mappings.length} legacy paths replaced.`);
