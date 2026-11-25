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
  assert.ok(build.includes('window.OLEIRO_PREVIEW_ENABLED = ${previewEnabled}'));
});

test('admin dashboard simulated pending cards require the preview capability',()=>{
  const start=dashboard.indexOf('function managerHomePreviewPendingSlides()');
  const end=dashboard.indexOf('function managerHomePendingSlidesVisible',start);
  assert.ok(start>=0&&end>start);
  const source=dashboard.slice(start,end);
  assert.match(source,/if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return \\[\\];/);
  assert.match(source,/preview-volunteer-analysis/);
  assert.match(source,/preview-project-adjustments/);
});

test('legacy project administration is unavailable outside homologation',()=>{
  assert.match(projects,/if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return `<section/);
  assert.match(projects,/window\\.openLegacyProjectAdmin=function\\(id\\)\\{\\s*if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return;/);
  assert.match(projects,/window\\.approveLegacyProject=function\\(id\\)\\{if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return;/);
  assert.match(projects,/window\\.openLegacyAdjustment=function\\(id\\)\\{\\s*if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return;/);
  assert.match(service,/if\\(!PREVIEW_ENABLED\\)throw new Error\\('Projetos de legado estão disponíveis somente em homologação\\.'\\)/);
});

test('production and homologation deploy workflows set explicit build environments',()=>{
  assert.match(productionWorkflow,/APP_ENV:\\s*production/);
  assert.match(homologationWorkflow,/APP_ENV:\\s*homologation/);
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
    assert.match(adminHtml,/window\\.OLEIRO_PREVIEW_ENABLED = false/);
    assert.match(adminBundle,/const PREVIEW_ENABLED=window\\.OLEIRO_PREVIEW_ENABLED===true/);
    assert.match(adminBundle,/managerHomePreviewPendingSlides/);
    assert.match(adminBundle,/if\\(window\\.OleiroProjects\\?\\.isPreview!==true\\)return \\[\\];/);
  }finally{
    rmSync(output,{recursive:true,force:true});
  }
});
