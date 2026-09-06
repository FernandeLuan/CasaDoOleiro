import { access, cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(process.argv[2]||'site-dist');
const environment=process.env.APP_ENV||'homologation';
const commit=(process.env.GITHUB_SHA||process.env.RELEASE_SHA||'local').trim();
const buildId=(process.env.GITHUB_RUN_NUMBER||Date.now().toString(36)).toString();
const assetKey=`${environment}-${commit.slice(0,12)}-${buildId}`;

async function exists(target){try{await access(target);return true}catch{return false}}
async function rewrite(relative,transform){
  const file=path.join(out,relative);
  if(!(await exists(file)))throw new Error(`Arquivo obrigatório ausente no build: ${relative}`);
  const source=await readFile(file,'utf8');
  const next=transform(source);
  if(next!==source)await writeFile(file,next,'utf8');
}

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const dir of ['admin','portal','css','js','icons']){
  const source=path.join(root,dir);
  await access(source);
  await cp(source,path.join(out,dir),{recursive:true});
}
for(const file of ['index.html','manifest.webmanifest','.nojekyll']){
  const source=path.join(root,file);
  if(await exists(source))await copyFile(source,path.join(out,file));
}

// Arquivos de demonstração nunca fazem parte de um artefato executável.
await rm(path.join(out,'js','demo'),{recursive:true,force:true});

const adminModules=[
  'planning-page.js',
  'homologation-shell.js',
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

function enableAdminModule(source,name){
  let next=source;
  const prefixes=[
    "params.get('demo')!=='admin'||",
    'params.get("demo")!=="admin"||',
    "new URLSearchParams(location.search).get('demo')!=='admin'||",
    'new URLSearchParams(location.search).get("demo")!=="admin"||',
    "demo!=='admin'||",
    'demo!=="admin"||'
  ];
  for(const prefix of prefixes)next=next.split(prefix).join('');
  if(/(?:get\(['\"]demo['\"]\)|\bdemo\b)[^\n]{0,80}(?:!==|!=)[^\n]{0,30}admin/.test(next)){
    throw new Error(`Guard de demonstração ainda ativo em js/admin/${name}`);
  }
  return next;
}

for(const name of adminModules){
  await rewrite(`js/admin/${name}`,source=>enableAdminModule(source,name));
}

await rewrite('js/portal/desktop-shell.js',source=>{
  const legacy="if(!['candidate','volunteer'].includes(demo)||!/\\/portal\\//.test(location.pathname))return;";
  if(source.includes(legacy))return source.replace(legacy,"if(!/\\/portal\\//.test(location.pathname))return;");
  if(/get\(['\"]demo['\"]\)/.test(source))throw new Error('Guard de demonstração inesperado em js/portal/desktop-shell.js');
  return source;
});

await rewrite('js/shared/navigation.js',source=>{
  const marker='/* Homologação: somente Auth/IO e dados são substituídos quando ?demo=... está presente. */';
  const index=source.indexOf(marker);
  return index>=0?`${source.slice(0,index).trimEnd()}\n`:source;
});

await rewrite('admin/index.html',source=>{
  if(source.includes('data-clean-ui-admin'))return source;
  if(!source.includes('</body>'))throw new Error('admin/index.html sem </body>.');
  const tags=adminModules.map((name,index)=>`<script data-clean-ui-admin="${index+1}" src="../js/admin/${name}?v=${assetKey}"></script>`).join('');
  return source.replace('</body>',`${tags}</body>`);
});

await rewrite('portal/index.html',source=>{
  if(source.includes('data-clean-ui-portal'))return source;
  if(!source.includes('</body>'))throw new Error('portal/index.html sem </body>.');
  return source.replace('</body>',`<script data-clean-ui-portal="1" src="../js/portal/desktop-shell.js?v=${assetKey}"></script></body>`);
});

const htmlAssetPattern=/((?:src|href)="(?:\.\.\/)?(?:js|css)\/[^"?]+)(?:\?[^\"]*)?(\")/g;
for(const relative of ['index.html','admin/index.html','portal/index.html']){
  await rewrite(relative,source=>source.replace(htmlAssetPattern,`$1?v=${assetKey}$2`));
}

await writeFile(path.join(out,'release.json'),JSON.stringify({
  environment,
  build:buildId,
  commit,
  publishedAt:new Date().toISOString()
})+'\n','utf8');

console.log(`Clean site build ready: ${out}`);
console.log(`Environment: ${environment}`);
console.log(`Admin clean modules: ${adminModules.length}`);
console.log('Demo data excluded from runtime artifact.');
