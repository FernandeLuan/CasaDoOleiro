import { access, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'_site');

async function exists(target){try{await access(target);return true}catch{return false}}
async function rewrite(relative,transform){
  const file=path.join(root,relative);
  if(!(await exists(file)))throw new Error(`Arquivo obrigatório ausente no pacote: ${relative}`);
  const source=await readFile(file,'utf8');
  const next=transform(source);
  if(next!==source)await writeFile(file,next,'utf8');
}

const adminCleanModules=[
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
    throw new Error(`Guard de homologação ainda ativo em js/admin/${name}`);
  }
  return next;
}

for(const name of adminCleanModules){
  await rewrite(`js/admin/${name}`,source=>enableAdminModule(source,name));
}

await rewrite('js/portal/desktop-shell.js',source=>{
  const old="if(!['candidate','volunteer'].includes(demo)||!/\\/portal\\//.test(location.pathname))return;";
  const next=source.replace(old,"if(!/\\/portal\\//.test(location.pathname))return;");
  if(next===source)throw new Error('Guard do desktop-shell do portal não foi localizado.');
  return next;
});

await rewrite('js/shared/navigation.js',source=>{
  const marker='/* Homologação: somente Auth/IO e dados são substituídos quando ?demo=... está presente. */';
  const index=source.indexOf(marker);
  return index>=0?`${source.slice(0,index).trimEnd()}\n`:source;
});

await rewrite('admin/index.html',source=>{
  if(source.includes('data-prod-clean-admin'))return source;
  const tags=adminCleanModules.map((name,index)=>`<script data-prod-clean-admin="${index+1}" src="../js/admin/${name}?v=prod-clean-ui"></script>`).join('');
  if(!source.includes('</body>'))throw new Error('admin/index.html sem </body>.');
  return source.replace('</body>',`${tags}</body>`);
});

await rewrite('portal/index.html',source=>{
  if(source.includes('data-prod-clean-portal'))return source;
  if(!source.includes('</body>'))throw new Error('portal/index.html sem </body>.');
  return source.replace('</body>','<script data-prod-clean-portal="1" src="../js/portal/desktop-shell.js?v=prod-clean-ui"></script></body>');
});

const removePaths=[
  'homologacao',
  'js/demo',
  'preview-dist',
  'release-dist',
  'docs',
  'functions',
  'scripts',
  'build-preview.mjs',
  'firebase.preview.json',
  'firebase.release-preview.json',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'BACKEND.md',
  'FIREBASE_SETUP.md',
  'README.md',
  'package.json',
  'package-lock.json'
];
for(const relative of removePaths)await rm(path.join(root,relative),{recursive:true,force:true});

console.log(`Production clean UI prepared at ${root}`);
console.log(`Admin modules enabled: ${adminCleanModules.length}`);
console.log('Portal desktop shell enabled for authenticated candidate/volunteer flows.');
console.log('Homologation/demo loaders removed from shared navigation.');
