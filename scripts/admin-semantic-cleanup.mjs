import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const replacements=new Map([
  ['review-signals.js','review-signals.js'],
  ['review-actions.js','review-actions.js'],
  ['review-polish.js','review-polish.js'],
  ['review-cards.js','review-cards.js'],
  ['review-flow.js','review-flow.js'],
]);

for(const [oldName,newName] of replacements){
  const oldPath=`js/admin/${oldName}`,newPath=`js/admin/${newName}`;
  if(existsSync(oldPath)&&!existsSync(newPath))renameSync(oldPath,newPath);
}

const assistant='js/admin/activity-assistant.js';
const hardening='js/admin/activity-assistant-hardening-r31.js';
const canonicalAssistant='js/admin/activity-assistant.js';
if(existsSync(assistant)&&existsSync(hardening)){
  const base=readFileSync(assistant,'utf8').replace('/* Round 31 — activity assistant shell, scoped permissions and schedule support. */','/* Assistente de atividades — permissões, agenda e proteções de interface. */');
  const guard=readFileSync(hardening,'utf8').replace('/* Round 31 — defense-in-depth UI guard for the activity assistant role. */','/* Proteções adicionais do perfil de assistente de atividades. */');
  writeFileSync(canonicalAssistant,`${base.trimEnd()}\n\n${guard.trim()}\n`);
  unlinkSync(assistant);unlinkSync(hardening);
}

const pairs=[
  ...replacements,
  ['activity-assistant.js','activity-assistant.js'],
];
const roots=['admin','portal','js','tests','scripts'];
const textExt=new Set(['.html','.js','.mjs','.css','.json','.md','.yml','.yaml']);
function rewriteTree(root){
  if(!existsSync(root))return;
  for(const name of readdirSync(root)){
    const path=join(root,name),st=statSync(path);
    if(st.isDirectory()){rewriteTree(path);continue}
    if(!textExt.has(extname(path)))continue;
    let source=readFileSync(path,'utf8'),next=source;
    for(const [from,to] of pairs)next=next.split(from).join(to);
    next=next.replace(/<script src="\.\.\/js\/admin\/activity-assistant\.js\?v=20260901-r47"><\/script><script src="\.\.\/js\/admin\/activity-assistant-hardening-r31\.js\?v=20260901-r47"><\/script>/g,'<script src="../js/admin/activity-assistant.js?v=20260901-r47"></script>');
    if(next!==source)writeFileSync(path,next);
  }
}
roots.forEach(rewriteTree);

const admin='admin/index.html';
let html=readFileSync(admin,'utf8');
html=html.replace(/<script src="\.\.\/js\/admin\/activity-assistant\.js\?v=20260901-r47"><\/script><script src="\.\.\/js\/admin\/activity-assistant-hardening-r31\.js\?v=20260901-r47"><\/script>/g,'<script src="../js/admin/activity-assistant.js?v=20260901-r47"></script>');
writeFileSync(admin,html);

const checker='scripts/check-homologation-architecture.mjs';
let check=readFileSync(checker,'utf8');
const marker="'js/admin/confirm-r15.js'";
const legacy=[
  'js/admin/review-signals.js','js/admin/review-actions.js','js/admin/review-polish.js','js/admin/review-cards.js',
  'js/admin/activity-assistant.js','js/admin/activity-assistant-hardening-r31.js','js/admin/review-flow.js','css/round27.css'
];
if(check.includes(marker)&&!check.includes(legacy[0]))check=check.replace(marker,`${marker},${legacy.map(v=>`'${v}'`).join(',')}`);
writeFileSync(checker,check);

const stale=[];
for(const path of ['js/admin/review-signals.js','js/admin/review-actions.js','js/admin/review-polish.js','js/admin/review-cards.js','js/admin/activity-assistant.js','js/admin/activity-assistant-hardening-r31.js','js/admin/review-flow.js'])if(existsSync(path))stale.push(path);
if(stale.length)throw new Error(`Legacy files remain: ${stale.join(', ')}`);
for(const path of ['js/admin/review-signals.js','js/admin/review-actions.js','js/admin/review-polish.js','js/admin/review-cards.js','js/admin/activity-assistant.js','js/admin/review-flow.js'])if(!existsSync(path))throw new Error(`Canonical module missing: ${path}`);
console.log('Admin semantic cleanup applied.');
