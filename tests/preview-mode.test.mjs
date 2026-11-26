import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const read = file => readFileSync(file, 'utf8');
const service=read('js/services/project-preview-service.js');
const dashboard=read('js/admin/dashboard.js');
const projects=read('js/admin/projects.js');
const portal=read('js/portal/project.js');
const navigation=read('js/shared/navigation.js');
const rules=read('firestore.rules');
const build=read('scripts/build-site.mjs');
const productionWorkflow=read('.github/workflows/deploy-pages.yml');
const homologationWorkflow=read('.github/workflows/deploy-homologacao.yml');

test('simulated dashboard cards remain restricted to homologation',()=>{
  const start=dashboard.indexOf('function managerHomePreviewPendingSlides()');
  const end=dashboard.indexOf('function managerHomePendingSlidesVisible',start);
  assert.ok(start>=0&&end>start);
  const source=dashboard.slice(start,end);
  assert.match(source,/if\(window\.OleiroProjects\?\.isPreview!==true\)return \[\]/);
  assert.match(source,/preview-volunteer-analysis/);
});

test('production projects use Firestore and do not store project data in localStorage',()=>{
  assert.match(service,/collection\(ctx\.db,'legacy_projects'\)/);
  assert.match(service,/firestore\.setDoc/);
  assert.match(service,/firestore\.updateDoc/);
  assert.match(service,/firestore\.getDocs/);
  assert.match(service,/isPreview:false/);
  assert.ok(service.includes('const PREVIEW_ENABLED=window.OLEIRO_PREVIEW_ENABLED===true'));
  assert.ok(service.includes('if(PREVIEW_ENABLED){'));
  assert.ok(service.includes('isPreview:true'));
  assert.ok(service.includes('isPreview:false'));
  assert.doesNotMatch(projects,/isPreview!==true/);
  assert.match(portal,/await window\.OleiroProjects\.saveOwn/);
  assert.match(navigation,/OleiroProjects\?\.loadAll/);
});

test('Firestore rules isolate project reads by owner or assigned unit and enforce lifecycle transitions',()=>{
  assert.match(rules,/match \/legacy_projects\/\{projectId\}/);
  assert.match(rules,/projectOwnerMatchesApplication/);
  assert.match(rules,/participantUpdatesLegacyProject/);
  assert.match(rules,/managerReviewsLegacyProject/);
  assert.match(rules,/allow delete: if false/);
});

test('production and homologation deploy workflows set explicit build environments',()=>{
  assert.match(productionWorkflow,/APP_ENV: production/);
  assert.match(homologationWorkflow,/APP_ENV: homologation/);
});

test('production build bundles Firestore-backed projects and keeps simulated dashboard content disabled',()=>{
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
    assert.ok(adminBundle.includes("collection(ctx.db,'legacy_projects')"));
    assert.ok(adminBundle.includes('function managerHomePreviewPendingSlides()'));
    assert.ok(adminBundle.includes('if(window.OleiroProjects?.isPreview!==true)return [];'));
    assert.ok(!adminBundle.includes('if(window.OleiroProjects?.isPreview!==true)return;'));
  }finally{
    rmSync(output,{recursive:true,force:true});
  }
});
