import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';

// One-time canonical login migration. Touching this file triggers the helper workflow.
const base='js/login.js';
const legacy=['js/login-round3.js','js/login-round4.js'];
for(const path of [base,...legacy])if(!existsSync(path))throw new Error(`Missing login source: ${path}`);

const sections=legacy.map(path=>readFileSync(path,'utf8').replace(/^\/\*[^]*?\*\/\s*/,'').trim());
let login=readFileSync(base,'utf8').trimEnd();
login+='\n\n/* Login validation, password visibility and busy-state behavior. */\n'+sections.join('\n\n')+'\n';
writeFileSync(base,login);
legacy.forEach(unlinkSync);

const htmlPath='index.html';
let html=readFileSync(htmlPath,'utf8');
for(const path of ['js/login-round3.js','js/login-round4.js']){
  const pattern=new RegExp(`\\s*<script src="${path.replaceAll('.','\\.')}\\?v=[^"]+"></script>`,'g');
  html=html.replace(pattern,'');
}
if(!html.includes('js/login.js'))throw new Error('index.html lost canonical login.js reference.');
if(/login-round[34]\.js/.test(html))throw new Error('Legacy login script reference remains.');
writeFileSync(htmlPath,html);

const checker='scripts/check-homologation-architecture.mjs';
let source=readFileSync(checker,'utf8');
const anchor="'js/services/review-flow-r31-service.js'";
if(!source.includes(anchor))throw new Error('Checker anchor not found.');
if(!source.includes("'js/login-round3.js'"))source=source.replace(anchor,`${anchor},'js/login-round3.js','js/login-round4.js'`);
writeFileSync(checker,source);

console.log('Login round layers consolidated into js/login.js.');
