import { access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'preview-dist');
const dirs=['admin','portal','css','js','icons','homologacao'];
const optional=['manifest.webmanifest','release.json'];

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const dir of dirs){const src=path.join(root,dir);await access(src);await cp(src,path.join(out,dir),{recursive:true});}
for(const file of optional){try{await access(path.join(root,file));await copyFile(path.join(root,file),path.join(out,file));}catch{}}
await copyFile(path.join(root,'homologacao','index.html'),path.join(out,'index.html'));
console.log('R62 preview package ready at preview-dist/');
console.log('Root index: homologacao/index.html');
