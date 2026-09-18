import { access, cp, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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


async function auditRuntimeSources(siteRoot){
  const entryFiles=['index.html','admin/index.html','portal/index.html'];
  const referenced=new Set();
  for(const entry of entryFiles){
    const source=await readFile(path.join(siteRoot,entry),'utf8');
    const local=[...source.matchAll(/<script[^>]+src=["']((?:\.\.\/)?js\/[^"'?]+)(?:\?[^"']*)?["'][^>]*><\/script>/g)]
      .map(match=>path.normalize(path.join(path.dirname(entry),match[1])).replaceAll('\\','/').replace(/^\.\.\//,''));
    const seen=new Set();
    for(const file of local){
      if(seen.has(file))throw new Error(`${entry}: script duplicado: ${file}`);
      seen.add(file);referenced.add(file);
    }
  }

  const runtimeDirs=['js/admin','js/portal','js/shared','js/services','js/firebase'];
  const runtime=[];
  async function walk(dir){
    const absolute=path.join(siteRoot,dir);
    for(const item of await readdir(absolute,{withFileTypes:true})){
      const relative=`${dir}/${item.name}`;
      if(item.isDirectory()){if(item.name!=='demo')await walk(relative)}
      else if(item.isFile()&&item.name.endsWith('.js'))runtime.push(relative.replaceAll('\\','/'));
    }
  }
  for(const dir of runtimeDirs)await walk(dir);
  const orphaned=runtime.filter(file=>!referenced.has(file));
  if(orphaned.length)throw new Error('Módulos JS sem entrypoint: '+orphaned.join(', '));
  return {modules:runtime.length,referenced:referenced.size};
}

async function writeClassicScriptBundle(entryFile,matches,target){
  const modules=[];
  for(const match of matches){
    const sourcePath=path.resolve(path.dirname(entryFile),match[2]);
    modules.push({path:match[2],code:await readFile(sourcePath,'utf8')});
  }
  // Execute each original classic script as its own script element. This preserves the
  // browser's per-script lexical environment while still reducing network requests.
  const payload=`(function(){const modules=${JSON.stringify(modules)};for(const module of modules){const script=document.createElement('script');script.type='text/javascript';script.dataset.oleiroBundleSource=module.path;script.text=module.code+"\\n//# sourceURL="+module.path;document.head.appendChild(script);script.remove();}})();\n`;
  await writeFile(path.join(out,target),payload,'utf8');
}

async function bundlePortalAssets(){
  const portalFile=path.join(out,'portal/index.html');
  let html=await readFile(portalFile,'utf8');

  const cssPattern=/<link\s+rel="stylesheet"\s+href="(\.\.\/css\/[^"?]+)(?:\?[^"]*)?"\s*>/g;
  const cssMatches=[...html.matchAll(cssPattern)];
  if(!cssMatches.length)throw new Error('Nenhum CSS local do Portal encontrado para bundle.');
  const cssParts=[];
  for(const match of cssMatches){
    const sourcePath=path.resolve(path.dirname(portalFile),match[1]);
    cssParts.push(`/* ${match[1]} */\n${await readFile(sourcePath,'utf8')}\n`);
    html=html.replace(match[0],'');
  }
  await writeFile(path.join(out,'css/portal.bundle.css'),cssParts.join('\n'),'utf8');
  html=html.replace('</head>','<link rel="stylesheet" href="../css/portal.bundle.css"></head>');

  const scriptPattern=/<script([^>]*)\s+src="(\.\.\/js\/[^"?]+)(?:\?[^"]*)?"([^>]*)><\/script>/g;
  const scriptMatches=[...html.matchAll(scriptPattern)];
  const configIndex=scriptMatches.findIndex(match=>match[2].endsWith('/firebase/firebase-config.js'));
  if(configIndex<0)throw new Error('firebase-config.js não encontrado no Portal.');

  const pre=scriptMatches.slice(0,configIndex);
  const config=scriptMatches[configIndex];
  const post=scriptMatches.slice(configIndex+1);
  if(!pre.length||!post.length)throw new Error('Ordem de scripts do Portal inválida para bundle.');

  await writeClassicScriptBundle(portalFile,pre,'js/portal-pre.bundle.js');
  await writeClassicScriptBundle(portalFile,post,'js/portal.bundle.js');

  for(const match of scriptMatches)html=html.replace(match[0],'');
  const scripts=`<script src="../js/portal-pre.bundle.js"></script>${config[0]}<script data-clean-ui-portal="1" src="../js/portal.bundle.js"></script>`;
  html=html.replace('</body>',`${scripts}</body>`);
  await writeFile(portalFile,html,'utf8');

  return {css:cssMatches.length,js:scriptMatches.length};
}

async function bundleAdminAssets(){
  const adminFile=path.join(out,'admin/index.html');
  let html=await readFile(adminFile,'utf8');

  const cssPattern=/<link\s+([^>]*?)rel="stylesheet"([^>]*?)href="(\.\.\/css\/[^"?]+)(?:\?[^"]*)?"([^>]*)>/g;
  const cssMatches=[...html.matchAll(cssPattern)];
  if(!cssMatches.length)throw new Error('Nenhum CSS local do Admin encontrado para bundle.');
  const cssParts=[];
  for(const match of cssMatches){
    const sourcePath=path.resolve(path.dirname(adminFile),match[3]);
    cssParts.push(`/* ${match[3]} */\n${await readFile(sourcePath,'utf8')}\n`);
    html=html.replace(match[0],'');
  }
  await writeFile(path.join(out,'css/admin.bundle.css'),cssParts.join('\n'),'utf8');
  html=html.replace('</head>','<link rel="stylesheet" href="../css/admin.bundle.css"></head>');

  const scriptPattern=/<script([^>]*)\s+src="(\.\.\/js\/[^"?]+)(?:\?[^"]*)?"([^>]*)><\/script>/g;
  const scriptMatches=[...html.matchAll(scriptPattern)];
  const configIndex=scriptMatches.findIndex(match=>match[2].endsWith('/firebase/firebase-config.js'));
  if(configIndex<0)throw new Error('firebase-config.js não encontrado no Admin.');

  const pre=scriptMatches.slice(0,configIndex),config=scriptMatches[configIndex],post=scriptMatches.slice(configIndex+1);
  await writeClassicScriptBundle(adminFile,pre,'js/admin-pre.bundle.js');
  await writeClassicScriptBundle(adminFile,post,'js/admin.bundle.js');
  for(const match of scriptMatches)html=html.replace(match[0],'');
  html=html.replace('</body>',`<script src="../js/admin-pre.bundle.js"></script>${config[0]}<script data-clean-ui-admin="1" src="../js/admin.bundle.js"></script></body>`);
  await writeFile(adminFile,html,'utf8');
  return {css:cssMatches.length,js:scriptMatches.length};
}

// Fail before deleting the previous build or publishing a broken entry point.
await checkSiteAssets(root);
const runtimeAudit=await auditRuntimeSources(root);
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

const portalBundle=await bundlePortalAssets();
const adminBundle=await bundleAdminAssets();

const htmlAssetPattern=/((?:src|href)="(?:\.\.\/)?(?:js|css)\/[^"?]+)(?:\?[^\"]*)?(\")/g;
for(const relative of ['index.html','login.html','admin/index.html','portal/index.html']){
  await rewrite(relative,source=>source.replace(htmlAssetPattern,`$1?v=${assetKey}$2`));
}

await checkSiteAssets(out);
await writeFile(path.join(out,'release.json'),JSON.stringify({environment,build:buildId,commit,publishedAt:new Date().toISOString()})+'\n','utf8');
console.log(`Canonical site build ready: ${out}`);
console.log(`Environment: ${environment}`);
console.log(`Runtime source audit: ${runtimeAudit.modules} JS modules, no orphaned files.`);
console.log(`Portal bundles: ${portalBundle.js} scripts -> 3 requests; ${portalBundle.css} stylesheets -> 1 request.`);
console.log(`Admin bundles: ${adminBundle.js} scripts -> 3 requests; ${adminBundle.css} stylesheets -> 1 request.`);
console.log('Source modules remain separated for maintenance; runtime bundles preserve classic-script execution order.');
