import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function git(...args){return execFileSync('git',args,{encoding:'utf8'}).trim()}
const base=process.env.HOMOLOGATION_BASE||'origin/main';
const diff=git('diff','--name-status',`${base}...HEAD`).split(/\r?\n/).filter(Boolean);
const versioned=/(?:^|[._-])(?:r\d+[a-z]?|round\d+)(?:[._-]|$)/i;
const temporaryLegacyAssets=new Set([
  'css/planning-board-r65.css',
  'css/planning-person-agenda-r66.css'
]);
const violations=[];

for(const line of diff){
  const [status,...paths]=line.split(/\t/);const path=paths.at(-1)||'';
  if(!/^[AMR]/.test(status)||!versioned.test(path))continue;
  let existedInMain=true;try{git('cat-file','-e',`${base}:${path}`)}catch{existedInMain=false}
  if(!existedInMain&&!temporaryLegacyAssets.has(path))violations.push(`novo arquivo versionado: ${path}`);
}

for(const forbiddenPath of [
  'homologacao',
  'js/demo',
  'build-preview.mjs',
  'firebase.preview.json'
]){
  if(existsSync(forbiddenPath))violations.push(`artefato fake/preview obsoleto ainda versionado: ${forbiddenPath}`);
}
if(!existsSync('scripts/build-site.mjs'))violations.push('build canônico ausente: scripts/build-site.mjs');

const navigation=readFileSync('js/shared/navigation.js','utf8');
for(const forbidden of [
  'planning-actions-bootstrap',
  'home-r62-final.js',
  'homologation-integration-r63.js',
  'account-history-scroll-r71.js',
  'loadHomologationData',
  'loadHomologationAdminUi',
  '../demo/',
  '?demo='
]){
  if(navigation.includes(forbidden))violations.push(`navegação ainda contém runtime legado/fake: ${forbidden}`);
}

const runtimeMatch=navigation.match(/const files=\[([\s\S]*?)\];/g)||[];
for(const block of runtimeMatch){
  const paths=[...block.matchAll(/['"](\.\.\/[^'"]+)['"]/g)].map(match=>match[1]);
  for(const path of paths){if(versioned.test(path))violations.push(`runtime usa módulo versionado: ${path}`)}
}

if(violations.length){console.error('Arquitetura da homologação reprovada:\n- '+violations.join('\n- '));process.exit(1)}
console.log('Arquitetura da homologação: OK — sem massa fake no runtime e com build canônico.');
