import { access, readFile, rename, rm, writeFile } from 'node:fs/promises';

const adminModules=[
  'planning-page.js',
  'admin-shell.js',
  'planning-board.js',
  'planning-person-agenda.js',
  'planning-group-editor.js',
  'planning-mobile-filters.js',
  'volunteer-status-inline.js',
  'planning-profile-layout.js',
  'account-consolidated.js',
  'account-history.js',
  'profile-polish.js',
  'emergency-contact-sync.js',
  'account-consistency.js',
  'account-emergency-live.js',
  'occupancy-page.js',
  'occupancy-mobile.js',
  'admin-navigation.js',
  'groups-page.js',
  'house-info-page.js',
  'account-settings.js'
];

async function exists(path){try{await access(path);return true}catch{return false}}
async function text(path){return readFile(path,'utf8')}
async function put(path,content){await writeFile(path,content,'utf8')}

function stripAdminDemoGuard(source,path){
  let next=source;
  for(const prefix of [
    "params.get('demo')!=='admin'||",
    'params.get("demo")!=="admin"||',
    "new URLSearchParams(location.search).get('demo')!=='admin'||",
    'new URLSearchParams(location.search).get("demo")!=="admin"||',
    "demo!=='admin'||",
    'demo!=="admin"||'
  ])next=next.split(prefix).join('');

  const paramsUses=(next.match(/\bparams\b/g)||[]).length;
  if(paramsUses===1)next=next.replace(/^\s*const params=new URLSearchParams\(location\.search\);\s*\n/m,'');
  const demoUses=(next.match(/\bdemo\b/g)||[]).length;
  if(demoUses===1)next=next.replace(/^\s*const demo=params\.get\(['"]demo['"]\);\s*\n/m,'');

  if(/(?:get\(['"]demo['"]\)|\bdemo\b)[^\n]{0,90}(?:!==|!=)[^\n]{0,40}admin/.test(next))throw new Error(`Guard de demo não removido em ${path}`);
  return next;
}

// 1. Shell administrativo passa a ser fonte produtiva, não artefato de homologação.
if(await exists('js/admin/homologation-shell.js')){
  let source=await text('js/admin/homologation-shell.js');
  source=stripAdminDemoGuard(source,'js/admin/homologation-shell.js')
    .replace('/* Shell da homologação: navegação desktop, Planejamento e Ocupação como páginas reais. */','/* Shell administrativo: navegação desktop e composição das páginas de gestão. */')
    .replace('(function homologationShell(){','(function adminShell(){')
    .replaceAll('homologationShellStyles','adminShellStyles')
    .replaceAll('__OLEIRO_HOMOLOGATION_SHELL__','__OLEIRO_ADMIN_SHELL__');
  await put('js/admin/admin-shell.js',source);
  await rm('js/admin/homologation-shell.js');
}

// 2. Os demais módulos novos deixam de depender de ?demo=admin.
for(const name of adminModules.filter(name=>name!=='admin-shell.js')){
  const path=`js/admin/${name}`;
  let source=await text(path);
  source=stripAdminDemoGuard(source,path);
  if(name==='occupancy-page.js')source=source.replace('/* Página de Ocupação da homologação: calendário mensal, unidade e detalhe do dia. */','/* Página administrativa de Ocupação: calendário mensal, unidade e detalhe do dia. */');
  if(name==='groups-page.js')source=source.replace('/* Página de Grupos da homologação: unidades lado a lado e edição inline de integrantes. */','/* Página administrativa de Grupos: unidades lado a lado e edição inline de integrantes. */');
  if(name==='admin-navigation.js')source=source.replace('/* Navegação e hierarquia visual definitivas do Admin na homologação. */','/* Navegação e hierarquia visual do Admin. */');
  await put(path,source);
}

// 3. Portal desktop também vira runtime canônico.
{
  const path='js/portal/desktop-shell.js';
  let source=await text(path);
  source=source
    .replace('/* Shell desktop da homologação para candidato e voluntário aprovado. */','/* Shell desktop do portal para candidato e voluntário aprovado. */')
    .replace(/^\s*const params=new URLSearchParams\(location\.search\);\s*\n\s*const demo=params\.get\(['"]demo['"]\);\s*\n/m,'')
    .replace("if(!['candidate','volunteer'].includes(demo)||!/\\/portal\\//.test(location.pathname))return;","if(!/\\/portal\\//.test(location.pathname))return;");
  if(/get\(['"]demo['"]\)|\bdemo\b/.test(source))throw new Error('desktop-shell.js ainda depende de demo.');
  await put(path,source);
}

// 4. Remove os dois últimos nomes de CSS versionados criados pela Clean UI.
if(await exists('css/planning-board-r65.css'))await rename('css/planning-board-r65.css','css/planning-board.css');
if(await exists('css/planning-person-agenda-r66.css'))await rename('css/planning-person-agenda-r66.css','css/planning-person-agenda.css');
{
  const path='js/admin/planning-board.js';
  let source=await text(path);
  source=source
    .replace('/* R65 — Planejamento deixa de ser uma segunda lista de voluntários e vira quadro por dia/voluntário. */','/* Planejamento em quadro por dia e voluntário. */')
    .replaceAll('planning-board-r65','planning-board')
    .replaceAll('planningBoardR65','planningBoard')
    .replaceAll('PLANNING_BOARD_R65','PLANNING_BOARD');
  await put(path,source);
}
{
  const path='js/admin/planning-person-agenda.js';
  let source=await text(path);
  source=source
    .replaceAll('planning-person-agenda-r66','planning-person-agenda')
    .replaceAll('PLANNING_PERSON_AGENDA_R66','PLANNING_PERSON_AGENDA');
  await put(path,source);
}

// 5. HTML passa a declarar diretamente tudo que executa no Admin/Portal.
{
  const path='admin/index.html';
  let source=await text(path);
  source=source.replace(/<script data-clean-ui-admin="\d+"[^>]*><\/script>/g,'');
  const styleTags=[
    '<link data-planning-page-style="1" rel="stylesheet" href="../css/planning-page.css?v=canonical">',
    '<link data-planning-board="1" rel="stylesheet" href="../css/planning-board.css?v=canonical">',
    '<link data-planning-person-agenda="1" rel="stylesheet" href="../css/planning-person-agenda.css?v=canonical">'
  ].join('');
  if(!source.includes('data-planning-page-style'))source=source.replace('<link rel="manifest"',`${styleTags}<link rel="manifest"`);
  const tags=adminModules.map((name,index)=>`<script data-clean-ui-admin="${index+1}" src="../js/admin/${name}?v=canonical"></script>`).join('');
  if(!source.includes('</body>'))throw new Error('admin/index.html sem </body>.');
  source=source.replace('</body>',`${tags}</body>`);
  await put(path,source);
}
{
  const path='portal/index.html';
  let source=await text(path);
  source=source.replace(/<script data-clean-ui-portal="1"[^>]*><\/script>/g,'');
  if(!source.includes('</body>'))throw new Error('portal/index.html sem </body>.');
  source=source.replace('</body>','<script data-clean-ui-portal="1" src="../js/portal/desktop-shell.js?v=canonical"></script></body>');
  await put(path,source);
}

// 6. Build deixa de converter homologação em produção. Ele apenas empacota a MESMA fonte.
await put('scripts/build-site.mjs',`import { access, cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(process.argv[2]||'site-dist');
const environment=process.env.APP_ENV||'homologation';
const commit=(process.env.GITHUB_SHA||process.env.RELEASE_SHA||'local').trim();
const buildId=(process.env.GITHUB_RUN_NUMBER||Date.now().toString(36)).toString();
const assetKey=\`${'${environment}-${commit.slice(0,12)}-${buildId}'}\`;

async function exists(target){try{await access(target);return true}catch{return false}}
async function rewrite(relative,transform){
  const file=path.join(out,relative);
  if(!(await exists(file)))throw new Error(\`Arquivo obrigatório ausente no build: ${'${relative}'}\`);
  const source=await readFile(file,'utf8');
  const next=transform(source);
  if(next!==source)await writeFile(file,next,'utf8');
}

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const dir of ['admin','portal','css','js','icons']){
  const source=path.join(root,dir);await access(source);await cp(source,path.join(out,dir),{recursive:true});
}
for(const file of ['index.html','manifest.webmanifest','.nojekyll']){
  const source=path.join(root,file);if(await exists(source))await copyFile(source,path.join(out,file));
}
await copyFile(path.join(root,'index.html'),path.join(out,'login.html'));
await rm(path.join(out,'js','demo'),{recursive:true,force:true});

const admin=await readFile(path.join(out,'admin/index.html'),'utf8');
const portal=await readFile(path.join(out,'portal/index.html'),'utf8');
if(!admin.includes('data-clean-ui-admin="1"')||!admin.includes('../js/admin/admin-shell.js'))throw new Error('Admin Clean UI não está declarado diretamente na fonte.');
if(!portal.includes('data-clean-ui-portal="1"'))throw new Error('Portal desktop shell não está declarado diretamente na fonte.');

const htmlAssetPattern=/((?:src|href)="(?:\\.\\.\\/)?(?:js|css)\\/[^"?]+)(?:\\?[^\\"]*)?(\\")/g;
for(const relative of ['index.html','login.html','admin/index.html','portal/index.html']){
  await rewrite(relative,source=>source.replace(htmlAssetPattern,\`$1?v=${'${assetKey}'}$2\`));
}

await writeFile(path.join(out,'release.json'),JSON.stringify({environment,build:buildId,commit,publishedAt:new Date().toISOString()})+'\\n','utf8');
console.log(\`Canonical site build ready: ${'${out}'}\`);
console.log(\`Environment: ${'${environment}'}\`);
console.log('Source and runtime now use the same application structure.');
`);

// 7. A validação passa a impedir que a arquitetura paralela volte.
await put('scripts/check-homologation-architecture.mjs',`import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function git(...args){return execFileSync('git',args,{encoding:'utf8'}).trim()}
const base=process.env.HOMOLOGATION_BASE||'origin/main';
const diff=git('diff','--name-status',\`${'${base}'}...HEAD\`).split(/\\r?\\n/).filter(Boolean);
const versioned=/(?:^|[._-])(?:r\\d+[a-z]?|round\\d+)(?:[._-]|$)/i;
const violations=[];

for(const line of diff){
  const [status,...paths]=line.split(/\\t/);const path=paths.at(-1)||'';
  if(!/^[AMR]/.test(status)||!versioned.test(path))continue;
  let existedInMain=true;try{git('cat-file','-e',\`${'${base}:${path}'}\`)}catch{existedInMain=false}
  if(!existedInMain)violations.push(\`novo arquivo versionado: ${'${path}'}\`);
}

for(const forbiddenPath of ['homologacao','js/demo','build-preview.mjs','firebase.preview.json','js/admin/homologation-shell.js','css/planning-board-r65.css','css/planning-person-agenda-r66.css']){
  if(existsSync(forbiddenPath))violations.push(\`artefato legado ainda versionado: ${'${forbiddenPath}'}\`);
}
for(const required of ['scripts/build-site.mjs','js/admin/admin-shell.js','css/planning-board.css','css/planning-person-agenda.css']){
  if(!existsSync(required))violations.push(\`arquivo canônico ausente: ${'${required}'}\`);
}

const adminModules=${JSON.stringify(adminModules)};
const adminHtml=readFileSync('admin/index.html','utf8');
for(const name of adminModules){if(!adminHtml.includes(\`../js/admin/${'${name}'}\`))violations.push(\`Admin não carrega diretamente: ${'${name}'}\`)}
for(const style of ['planning-page.css','planning-board.css','planning-person-agenda.css']){if(!adminHtml.includes(\`../css/${'${style}'}\`))violations.push(\`Admin não carrega diretamente: ${'${style}'}\`)}
const portalHtml=readFileSync('portal/index.html','utf8');
if(!portalHtml.includes('../js/portal/desktop-shell.js'))violations.push('Portal não carrega desktop-shell.js diretamente.');

for(const name of adminModules){
  const source=readFileSync(\`js/admin/${'${name}'}\`,'utf8');
  if(/get\\(['"]demo['"]\\)|\\?demo=/.test(source))violations.push(\`módulo Admin ainda depende de demo: ${'${name}'}\`);
}
const portalShell=readFileSync('js/portal/desktop-shell.js','utf8');
if(/get\\(['"]demo['"]\\)|\\?demo=|\\bdemo\\b/.test(portalShell))violations.push('desktop-shell do Portal ainda depende de demo.');

const navigation=readFileSync('js/shared/navigation.js','utf8');
for(const forbidden of ['loadHomologationData','loadHomologationAdminUi','../demo/','?demo='])if(navigation.includes(forbidden))violations.push(\`navegação ainda contém runtime fake: ${'${forbidden}'}\`);
const build=readFileSync('scripts/build-site.mjs','utf8');
for(const forbidden of ['enableAdminModule','homologation-shell.js','params.get(\\'demo\\')','data-clean-ui-admin="${'${index+1}'}"'])if(build.includes(forbidden))violations.push(\`build ainda transforma runtime: ${'${forbidden}'}\`);

if(violations.length){console.error('Arquitetura da homologação reprovada:\\n- '+violations.join('\\n- '));process.exit(1)}
console.log('Arquitetura da homologação: OK — fonte canônica, sem massa fake e sem transformação HML→PRD.');
`);

console.log('One-time canonical source migration applied.');
