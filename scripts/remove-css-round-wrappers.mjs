import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const replacements=[
  [
    '<link rel="stylesheet" href="../css/round31.css?v=20260901-r47">',
    '<link rel="stylesheet" href="../css/review-workflow-base.css?v=20260901-r47"><link rel="stylesheet" href="../css/occupancy-assistant.css?v=20260901-r47">'
  ],
  [
    '<link rel="stylesheet" href="../css/round32.css?v=20260901-r47">',
    '<link rel="stylesheet" href="../css/desktop.css?v=20260901-r47"><link rel="stylesheet" href="../css/review-workflow.css?v=20260901-r47"><link rel="stylesheet" href="../css/emergency-contact.css?v=20260901-r47">'
  ]
];

for(const path of ['admin/index.html','portal/index.html']){
  let html=readFileSync(path,'utf8');
  for(const [from,to] of replacements){
    if(!html.includes(from))throw new Error(`${path}: compatibility stylesheet reference missing: ${from}`);
    html=html.replace(from,to);
  }
  writeFileSync(path,html);
}

for(const path of ['css/round31.css','css/round32.css']){
  if(!existsSync(path))throw new Error(`Expected compatibility wrapper missing: ${path}`);
  unlinkSync(path);
}

const checker='scripts/check-homologation-architecture.mjs';
let source=readFileSync(checker,'utf8');
const anchor="'css/round27.css'";
if(!source.includes(anchor))throw new Error('Architecture checker legacy-list anchor not found.');
if(!source.includes("'css/round31.css'"))source=source.replace(anchor,`${anchor},'css/round31.css','css/round32.css'`);
writeFileSync(checker,source);

for(const path of ['admin/index.html','portal/index.html']){
  const html=readFileSync(path,'utf8');
  if(/round(?:31|32)\.css/.test(html))throw new Error(`${path}: round CSS wrapper reference remains.`);
  for(const name of ['review-workflow-base.css','occupancy-assistant.css','desktop.css','review-workflow.css','emergency-contact.css']){
    if(!html.includes(`../css/${name}`))throw new Error(`${path}: semantic stylesheet missing: ${name}`);
  }
}
console.log('Round 31/32 CSS wrappers removed; semantic stylesheets are direct dependencies.');
