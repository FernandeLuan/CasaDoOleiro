import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';

// One-time migration. Preserve each stylesheet's position and rule order.
const bundles=[
  {target:'css/ui-foundation.css',sources:['css/round3.css','css/round4.css','css/round5.css','css/round6.css','css/round7.css']},
  {target:'css/workflow-foundation.css',sources:['css/round12.css','css/round15.css','css/round16.css','css/round18.css']},
  {target:'css/admin-profile-refinements.css',sources:['css/round19.css']},
  {target:'css/workflow-refinements.css',sources:['css/round20.css','css/round25.css']}
];
const read=path=>readFileSync(path,'utf8');
const write=(path,content)=>writeFileSync(path,content,'utf8');
const cssContent=Object.fromEntries(bundles.flatMap(bundle=>bundle.sources).map(path=>[path,read(path)]));
for(const bundle of bundles){
  if(existsSync(bundle.target))throw new Error(`Target already exists: ${bundle.target}`);
  const body=bundle.sources.map(source=>`/* Consolidated from ${source}. */\n${cssContent[source].trim()}`).join('\n\n');
  write(bundle.target,`/* Canonical stylesheet. Rules retain their original cascade order. */\n${body}\n`);
}
function replaceSequence(html,paths,target){
  const tags=paths.map(path=>`<link rel="stylesheet" href="../${path}?v=20260901-r47">`).join('');
  if(!html.includes(tags))throw new Error(`Expected contiguous stylesheet sequence missing for ${target}`);
  return html.replace(tags,`<link rel="stylesheet" href="../${target}?v=20260901-r47">`);
}
for(const path of ['admin/index.html','portal/index.html']){
  let html=read(path);
  html=replaceSequence(html,bundles[0].sources,bundles[0].target);
  html=replaceSequence(html,bundles[1].sources,bundles[1].target);
  if(path==='admin/index.html')html=replaceSequence(html,bundles[2].sources,bundles[2].target);
  html=replaceSequence(html,bundles[3].sources,bundles[3].target);
  write(path,html);
}
// The real login is a separate entry point and also uses the early round styles.
// Preserve its original stylesheet order rather than deleting its dependencies.
let login=read('index.html');
const loginGroups=[
  {sources:bundles[0].sources.slice(0,3),target:'css/ui-foundation.css'},
  {sources:['css/round18.css'],target:'css/workflow-foundation.css'}
];
for(const group of loginGroups){
  const expression=new RegExp(`(?:\\s*<link rel="stylesheet" href="${group.sources.join('|').replaceAll('.','\\.')}\\?v=[^\"]*">)+`);
  // Match only the intended consecutive tags, allowing their existing cache keys.
  const pattern=new RegExp(group.sources.map(path=>`\\s*<link rel="stylesheet" href="${path.replaceAll('.','\\.')}\\?v=[^\"]*">`).join(''));
  if(!pattern.test(login))throw new Error(`Login stylesheet sequence missing: ${group.sources.join(', ')}`);
  const sourceText=group.sources.map(path=>cssContent[path].trim()).join('\n\n');
  if(group.sources.length===1){
    // Keep the entire former round18 stylesheet in its original position.
    login=login.replace(pattern,`\n  <link rel="stylesheet" href="${group.target}?v=canonical">`);
  }else{
    // The shared bundle also includes rounds 6/7. They were not previously in login;
    // use a dedicated compatibility stylesheet so the login cascade is unchanged.
    const target='css/login-foundation.css';
    write(target,`/* Login-only legacy foundation; original rule order preserved. */\n${sourceText}\n`);
    login=login.replace(pattern,`\n  <link rel="stylesheet" href="${target}?v=canonical">`);
  }
}
// Preserve the old login's round18 content exactly, without importing rounds 12-16.
write('css/login-workflow.css',`/* Login-only workflow compatibility. */\n${cssContent['css/round18.css'].trim()}\n`);
login=login.replace('href="css/workflow-foundation.css?v=canonical"','href="css/login-workflow.css?v=canonical"');
login=login.replace('js/shared/i18n-r27.js','js/shared/i18n-keyed.js');
write('index.html',login);
for(const bundle of bundles)for(const source of bundle.sources)unlinkSync(source);
const checker='scripts/check-homologation-architecture.mjs';
let check=read(checker);
const forbiddenAnchor="'css/round27.css'";
if(!check.includes(forbiddenAnchor))throw new Error('CSS legacy checker anchor missing.');
const oldPaths=bundles.flatMap(bundle=>bundle.sources).map(path=>`'${path}'`).join(',');
if(!check.includes("'css/round3.css'"))check=check.replace(forbiddenAnchor,`${forbiddenAnchor},${oldPaths}`);
const requiredAnchor="'css/planning-person-agenda.css'";
if(!check.includes(requiredAnchor))throw new Error('CSS canonical checker anchor missing.');
const newPaths=[...bundles.map(bundle=>bundle.target),'css/login-foundation.css','css/login-workflow.css'].map(path=>`'${path}'`).join(',');
if(!check.includes("'css/ui-foundation.css'"))check=check.replace(requiredAnchor,`${requiredAnchor},${newPaths}`);
write(checker,check);
for(const path of ['admin/index.html','portal/index.html','index.html']){
  const html=read(path);
  if(/(?:src|href)=["'][^"']*(?:round(?:3|4|5|6|7|12|15|16|18|19|20|25)\.css|i18n-r27\.js)/.test(html))throw new Error(`${path}: removed asset reference remains.`);
}
console.log('Legacy CSS consolidated with login compatibility and all entry points updated.');
