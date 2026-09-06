import { existsSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';

const basePath='js/services/review-flow-r31-service.js';
const overridePath='js/services/review-flow-r31b-service.js';
const canonicalPath='js/services/review-service.js';
const i18nOld='js/shared/i18n-r31.js';
const i18nNew='js/shared/i18n-review.js';

for(const path of [basePath,overridePath,i18nOld])if(!existsSync(path))throw new Error(`Legacy source missing: ${path}`);
if(existsSync(canonicalPath)||existsSync(i18nNew))throw new Error('Canonical destination already exists.');

const base=readFileSync(basePath,'utf8')
  .replace('/* Round 31 — session-level reviews, unit-scoped occupancy and activity-assistant query guards. */','/* Revisão de sessões, ocupação por unidade e escopo do assistente de atividades. */')
  .replace('(function reviewFlowR31Service(){','(function reviewService(){');
const override=readFileSync(overridePath,'utf8')
  .replace('/* Round 31b — preserve the original session when the team requests an adjustment. */','/* Preserva a proposta original quando a equipe solicita ajuste. */')
  .replace('(function reviewFlowR31bService(){','(function preserveReviewBaseline(){');
writeFileSync(canonicalPath,`${base.trimEnd()}\n\n${override.trim()}\n`);
unlinkSync(basePath);
unlinkSync(overridePath);

renameSync(i18nOld,i18nNew);
let i18n=readFileSync(i18nNew,'utf8');
i18n=i18n.replace('/* Round 31/32 — keyed strings for session-specific review UX. */','/* Traduções por chave para a experiência de revisão de atividades. */').replace('(function i18nR31(){','(function reviewI18n(){');
writeFileSync(i18nNew,i18n);

for(const path of ['admin/index.html','portal/index.html']){
  let html=readFileSync(path,'utf8');
  const oldBase='<script src="../js/services/review-flow-r31-service.js?v=20260901-r47"></script>';
  const oldOverride='<script src="../js/services/review-flow-r31b-service.js?v=20260901-r47"></script>';
  if(!html.includes(oldBase)||!html.includes(oldOverride))throw new Error(`${path}: review service legacy references missing.`);
  html=html.replace(oldBase,'<script src="../js/services/review-service.js?v=20260901-r47"></script>').replace(oldOverride,'');
  if(!html.includes('../js/shared/i18n-r31.js'))throw new Error(`${path}: legacy review i18n reference missing.`);
  html=html.replace('../js/shared/i18n-r31.js','../js/shared/i18n-review.js');
  writeFileSync(path,html);
}

const checker='scripts/check-homologation-architecture.mjs';
let check=readFileSync(checker,'utf8');
const anchor="'css/round32.css'";
if(!check.includes(anchor))throw new Error('Architecture checker anchor missing.');
for(const legacy of [basePath,overridePath,i18nOld]){
  if(!check.includes(`'${legacy}'`))check=check.replace(anchor,`${anchor},'${legacy}'`);
}
writeFileSync(checker,check);

for(const path of [canonicalPath,i18nNew])if(!existsSync(path))throw new Error(`Canonical file missing: ${path}`);
for(const path of [basePath,overridePath,i18nOld])if(existsSync(path))throw new Error(`Legacy file remains: ${path}`);
for(const path of ['admin/index.html','portal/index.html']){
  const html=readFileSync(path,'utf8');
  for(const legacy of ['review-flow-r31-service.js','review-flow-r31b-service.js','i18n-r31.js'])if(html.includes(legacy))throw new Error(`${path}: legacy reference remains: ${legacy}`);
  for(const canonical of ['review-service.js','i18n-review.js'])if(!html.includes(canonical))throw new Error(`${path}: canonical reference missing: ${canonical}`);
}
console.log('Review service and review translations consolidated.');
