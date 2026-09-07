import { access, cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkSiteAssets } from './check-site-assets.mjs';

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

// Fail before deleting the previous build or publishing a broken entry point.
await checkSiteAssets(root);
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

const htmlAssetPattern=/((?:src|href)="(?:\.\.\/)?(?:js|css)\/[^"?]+)(?:\?[^\"]*)?(\")/g;
for(const relative of ['index.html','login.html','admin/index.html','portal/index.html']){
  await rewrite(relative,source=>source.replace(htmlAssetPattern,`$1?v=${assetKey}$2`));
}

await checkSiteAssets(out);
await writeFile(path.join(out,'release.json'),JSON.stringify({environment,build:buildId,commit,publishedAt:new Date().toISOString()})+'\n','utf8');
console.log(`Canonical site build ready: ${out}`);
console.log(`Environment: ${environment}`);
console.log('Source and runtime now use the same application structure.');
