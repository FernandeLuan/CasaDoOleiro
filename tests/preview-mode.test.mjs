import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const service=readFileSync('js/services/project-preview-service.js','utf8');
const dashboard=readFileSync('js/admin/dashboard.js','utf8');
const projects=readFileSync('js/admin/projects.js','utf8');
const build=readFileSync('scripts/build-site.mjs','utf8');
const productionWorkflow=readFileSync('.github/workflows/deploy-pages.yml','utf8');
const homologationWorkflow=readFileSync('.github/workflows/deploy-homologacao.yml','utf8');

test('preview capability is fail-closed unless the build explicitly enables homologation',()=>{
  assert.ok(service.includes('const PREVIEW_ENABLED=window.OLEIRO_PREVIEW_ENABLED===true;'));
  assert.ok(service.includes('isPreview:PREVIEW_ENABLED'));
  assert.ok(service.includes('if(!PREVIEW_ENABLED)return {};'));
  assert.ok(!service.includes('isPreview:true'));
  assert.ok(build.includes("const previewEnabled=environment==='homologation';"));
  assert.ok(build.includes('window.OLEIRO_PREVIEW_ENABLED = \${previewEnabled}'));
});

test('admin dashboard simulated pending cards require the preview capability',()=>{
  const start=dashboard.indexOf('function managerHomePreviewPendingSlides()');
  const end=dashboard.indexOf('function managerHomePendingSlidesVisible',start);
  assert.ok(start>=0&&end>start);
  const source=dashboard.slice(start,end);
  assert.ok(source.includes('if(window.OleiroProjects?.isPreview!==true)return [];'));
  assert.ok(source.includes('preview-volunteer-analysis'));
  assert.ok(source.includes('preview-project-adjustments'));
});

test('legacy project administration and every modal/write action are unavailable outside homologation',()=>{
  assert.ok(projects.includes('if(window.OleiroProjects?.isPreview!==true)return \`<section'));
  assert.ok(projects.includes('window.openLegacyProjectAdmin=function(id){\n    if(window.OleiroProjects?.isPreview!==true)return;'));
  assert.ok(projects.includes('window.approveLegacyProject=function(id){if(window.OleiroProjects?.isPreview!==true)return;'));
  assert.ok(projects.includes('window.openLegacyAdjustment=function(id){\n    if(window.OleiroProjects?.isPreview!==true)return;'));
  assert.ok(projects.includes('window.requestLegacyAdjustment=function(id){if(window.OleiroProjects?.isPreview!==true)return;'));
  assert.ok(service.includes("if(!PREVIEW_ENABLED)throw new Error('Projetos de legado estão disponíveis somente em homologação.')"));
});

test('production and homologation deploy workflows set explicit build environments',()=>{
  assert.ok(productionWorkflow.includes('APP_ENV: production'));
  assert.ok(homologationWorkflow.includes('APP_ENV: homologation'));
});

test('production build artifact explicitly disables preview in the admin entry point and bundled runtime',()=>{
  const output=mkdtempSync(path.join(tmpdir(),'oleiro-production-build-'));
  try{
    execFileSync(process.execPath,['scripts/build-site.mjs',output],{
      cwd:process.cwd(),
      env:{...process.env,APP_ENV:'production'},
      stdio:'pipe'
    });
    const adminHtml=readFileSync(path.join(output,'admin/index.html'),'utf8');
    const adminBundle=readFileSync(path.join(output,'js/admin.bundle.js'),'utf8');
    assert.ok(adminHtml.includes('window.OLEIRO_PREVIEW_ENABLED = false'));
    assert.ok(adminBundle.includes('const PREVIEW_ENABLED=window.OLEIRO_PREVIEW_ENABLED===true'));
    assert.ok(adminBundle.includes('function managerHomePreviewPendingSlides()'));
    assert.ok(adminBundle.includes('if(window.OleiroProjects?.isPreview!==true)return [];'));
    assert.ok(adminBundle.includes('window.openLegacyAdjustment=function(id){\n    if(window.OleiroProjects?.isPreview!==true)return;'));
  }finally{
    rmSync(output,{recursive:true,force:true});
  }
});
