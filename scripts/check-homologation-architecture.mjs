import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function git(...args){return execFileSync('git',args,{encoding:'utf8'}).trim()}
const base=process.env.HOMOLOGATION_BASE||'origin/main';
const diff=git('diff','--name-status',`${base}...HEAD`).split(/\r?\n/).filter(Boolean);
const versioned=/(?:^|[._-])(?:r\d+[a-z]?|round\d+)(?:[._-]|$)/i;
const violations=[];

for(const line of diff){
  const [status,...paths]=line.split(/\t/);const path=paths.at(-1)||'';
  if(!/^[AMR]/.test(status)||!versioned.test(path))continue;
  let existedInMain=true;try{git('cat-file','-e',`${base}:${path}`)}catch{existedInMain=false}
  if(!existedInMain)violations.push(`novo arquivo versionado: ${path}`);
}

for(const forbiddenPath of ['homologacao','js/demo','build-preview.mjs','firebase.preview.json','js/admin/homologation-shell.js','css/planning-board-r65.css','css/planning-person-agenda-r66.css','css/desktop-r49.css','js/admin/meeting-activity-r52.js','js/portal/meeting-activity-r51.js','js/portal/candidate-adjustment-r37.js','js/services/history-hooks-r27.js','js/services/selection-flow-r25-service.js','js/admin/history-r27.js','js/admin/selection-flow-r25.js','js/admin/selection-ui-r27.js','js/portal/selection-flow-r25.js','js/services/planning-days-r17-service.js','js/admin/planning-days-r17.js','js/portal/planning-days-r17.js','js/services/consistency-r15-services.js','js/admin/consistency-r15.js','js/portal/consistency-r15.js','js/admin/confirm-r15.js','js/admin/review-signals-r31.js','js/admin/review-actions-r31.js','js/admin/review-polish-r31.js','js/admin/review-cards-r31.js','js/admin/activity-assistant-r31.js','js/admin/activity-assistant-hardening-r31.js','js/admin/review-flow-r32.js','css/round27.css']){
  if(existsSync(forbiddenPath))violations.push(`artefato legado ainda versionado: ${forbiddenPath}`);
}
for(const required of ['scripts/build-site.mjs','js/admin/admin-shell.js','css/planning-board.css','css/planning-person-agenda.css']){
  if(!existsSync(required))violations.push(`arquivo canônico ausente: ${required}`);
}

function checkLocalAssets(htmlPath){
  const html=readFileSync(htmlPath,'utf8');
  const assetPattern=/(?:src|href)=["']([^"']+)["']/g;
  for(const match of html.matchAll(assetPattern)){
    const ref=String(match[1]||'').trim();
    if(!ref||/^(?:https?:|data:|mailto:|tel:|#|\/\/)/i.test(ref))continue;
    const clean=ref.split(/[?#]/,1)[0];
    if(!clean)continue;
    const absolute=resolve(dirname(htmlPath),clean);
    if(!existsSync(absolute))violations.push(`${htmlPath} referencia arquivo local ausente: ${ref}`);
  }
}
for(const htmlPath of ['admin/index.html','portal/index.html','index.html','login.html'])if(existsSync(htmlPath))checkLocalAssets(htmlPath);

const adminModules=["planning-page.js","admin-shell.js","planning-board.js","planning-person-agenda.js","planning-group-editor.js","planning-mobile-filters.js","volunteer-status-inline.js","planning-profile-layout.js","account-consolidated.js","account-history.js","profile-polish.js","emergency-contact-sync.js","account-consistency.js","account-emergency-live.js","occupancy-page.js","occupancy-mobile.js","admin-navigation.js","groups-page.js","house-info-page.js","account-settings.js"];
const adminHtml=readFileSync('admin/index.html','utf8');
for(const name of adminModules){if(!adminHtml.includes(`../js/admin/${name}`))violations.push(`Admin não carrega diretamente: ${name}`)}
for(const style of ['planning-page.css','planning-board.css','planning-person-agenda.css']){if(!adminHtml.includes(`../css/${style}`))violations.push(`Admin não carrega diretamente: ${style}`)}
const portalHtml=readFileSync('portal/index.html','utf8');
if(!portalHtml.includes('../js/portal/desktop-shell.js'))violations.push('Portal não carrega desktop-shell.js diretamente.');

for(const name of adminModules){
  const source=readFileSync(`js/admin/${name}`,'utf8');
  if(/get\(['"]demo['"]\)|\?demo=/.test(source))violations.push(`módulo Admin ainda depende de demo: ${name}`);
}
const portalShell=readFileSync('js/portal/desktop-shell.js','utf8');
if(/get\(['"]demo['"]\)|\?demo=|\bdemo\b/.test(portalShell))violations.push('desktop-shell do Portal ainda depende de demo.');

const navigation=readFileSync('js/shared/navigation.js','utf8');
for(const forbidden of ['loadHomologationData','loadHomologationAdminUi','../demo/','?demo='])if(navigation.includes(forbidden))violations.push(`navegação ainda contém runtime fake: ${forbidden}`);
const build=readFileSync('scripts/build-site.mjs','utf8');
for(const forbidden of ['enableAdminModule','homologation-shell.js','params.get(\'demo\')','data-clean-ui-admin="${index+1}"'])if(build.includes(forbidden))violations.push(`build ainda transforma runtime: ${forbidden}`);

if(violations.length){console.error('Arquitetura da homologação reprovada:\n- '+violations.join('\n- '));process.exit(1)}
console.log('Arquitetura da homologação: OK — fonte canônica, referências locais válidas, sem massa fake e sem transformação HML→PRD.');
