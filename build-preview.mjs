import { access, cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'preview-dist');
const dirs=['admin','portal','css','js','icons','homologacao'];
const optional=['manifest.webmanifest','release.json'];
const buildStamp=`20260904-${Date.now().toString(36)}`;

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const dir of dirs){const src=path.join(root,dir);await access(src);await cp(src,path.join(out,dir),{recursive:true});}
for(const file of optional){try{await access(path.join(root,file));await copyFile(path.join(root,file),path.join(out,file));}catch{}}
await copyFile(path.join(root,'index.html'),path.join(out,'login.html'));
await copyFile(path.join(root,'homologacao','index.html'),path.join(out,'index.html'));

async function rewrite(relativePath,transform){
  const file=path.join(out,relativePath);
  const source=await readFile(file,'utf8');
  const next=transform(source);
  if(next!==source)await writeFile(file,next,'utf8');
}

const bustHtml=source=>source.replace(/\?v=[^"']+/g,`?v=${buildStamp}`);
await rewrite('login.html',bustHtml);
await rewrite('admin/index.html',bustHtml);
await rewrite('portal/index.html',source=>{
  let next=bustHtml(source);
  if(!next.includes('../js/portal/desktop-shell.js'))next=next.replace('</body>',`<script src="../js/portal/desktop-shell.js?v=${buildStamp}"></script></body>`);
  return next;
});
await rewrite('js/shared/navigation.js',source=>source.replaceAll('20260903-clean-',`${buildStamp}-`));
await rewrite('js/admin/planning-person-agenda.js',source=>source.replaceAll('20260903-consolidated',buildStamp));

console.log(`R62 preview package ready at preview-dist/ (${buildStamp})`);
console.log('Root index: homologacao/index.html');
console.log('Login preview: /login.html');
