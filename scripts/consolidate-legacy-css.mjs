import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';

const bundles=[
  {target:'css/ui-foundation.css',sources:['css/round3.css','css/round4.css','css/round5.css','css/round6.css','css/round7.css']},
  {target:'css/workflow-foundation.css',sources:['css/round12.css','css/round15.css','css/round16.css','css/round18.css']},
  {target:'css/admin-profile-refinements.css',sources:['css/round19.css']},
  {target:'css/workflow-refinements.css',sources:['css/round20.css','css/round25.css']}
];

for(const bundle of bundles){
  if(existsSync(bundle.target))throw new Error(`Target already exists: ${bundle.target}`);
  for(const source of bundle.sources)if(!existsSync(source))throw new Error(`Missing legacy stylesheet: ${source}`);
  const body=bundle.sources.map(source=>`/* Consolidated from ${source}. */\n${readFileSync(source,'utf8').trim()}`).join('\n\n');
  writeFileSync(bundle.target,`/* Canonical stylesheet. Rules retain their original cascade order. */\n${body}\n`);
}

const replaceSequence=(html,paths,target)=>{
  const tags=paths.map(path=>`<link rel="stylesheet" href="../${path}?v=20260901-r47">`).join('');
  if(!html.includes(tags))throw new Error(`Expected contiguous stylesheet sequence missing for ${target}`);
  return html.replace(tags,`<link rel="stylesheet" href="../${target}?v=20260901-r47">`);
};

for(const path of ['admin/index.html','portal/index.html']){
  let html=readFileSync(path,'utf8');
  html=replaceSequence(html,['css/round3.css','css/round4.css','css/round5.css','css/round6.css','css/round7.css'],'css/ui-foundation.css');
  html=replaceSequence(html,['css/round12.css','css/round15.css','css/round16.css','css/round18.css'],'css/workflow-foundation.css');
  if(path==='admin/index.html')html=replaceSequence(html,['css/round19.css'],'css/admin-profile-refinements.css');
  html=replaceSequence(html,['css/round20.css','css/round25.css'],'css/workflow-refinements.css');
  writeFileSync(path,html);
}

for(const bundle of bundles)for(const source of bundle.sources)unlinkSync(source);

const checker='scripts/check-homologation-architecture.mjs';
let check=readFileSync(checker,'utf8');
const forbiddenAnchor="'css/round27.css'";
if(!check.includes(forbiddenAnchor))throw new Error('CSS legacy checker anchor missing.');
const oldPaths=bundles.flatMap(bundle=>bundle.sources).map(path=>`'${path}'`).join(',');
if(!check.includes("'css/round3.css'"))check=check.replace(forbiddenAnchor,`${forbiddenAnchor},${oldPaths}`);
const requiredAnchor="'css/planning-person-agenda.css'";
if(!check.includes(requiredAnchor))throw new Error('CSS canonical checker anchor missing.');
const newPaths=bundles.map(bundle=>`'${bundle.target}'`).join(',');
if(!check.includes("'css/ui-foundation.css'"))check=check.replace(requiredAnchor,`${requiredAnchor},${newPaths}`);
writeFileSync(checker,check);

for(const path of ['admin/index.html','portal/index.html']){
  const html=readFileSync(path,'utf8');
  if(/\.\.\/css\/round(?:3|4|5|6|7|12|15|16|18|19|20|25)\.css/.test(html))throw new Error(`${path}: legacy round stylesheet reference remains.`);
}
console.log('Legacy round CSS consolidated into four canonical stylesheets.');
