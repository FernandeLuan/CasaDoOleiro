import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('activity assistant is unit-scoped but operationally complete', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const admin=fs.readFileSync('js/admin/app.js','utf8');
  const apps=fs.readFileSync('js/services/application-service.js','utf8');
  const planning=fs.readFileSync('js/services/planning-service.js','utf8');
  expect(rules).toContain('assistantMayOperateApplication');
  expect(rules).toContain('assistantCreatesApplication');
  expect(rules).toContain('assistantUpdatesVolunteer');
  expect(rules).toContain("'confirmedAt', 'rejectedAt', 'managerCreated'");
  expect(admin).toContain('managerScopeUnitId');
  expect(admin).toContain("listPendingChanges({limit:100,unitId:managerScopeUnitId");
  expect(apps).toContain("async countStatus(status,{unit='all'}={})");
  expect(planning).toContain("async listPendingChanges({limit=100,unitId='all'}={})");
});

test('observability includes tracing, slow queries and strict privacy defaults', async () => {
  const monitor=fs.readFileSync('js/shared/monitoring.js','utf8');
  const core=fs.readFileSync('js/services/service-core.js','utf8');
  expect(monitor).toContain('browserTracingIntegration');
  expect(monitor).toContain('tracesSampleRate:0.10');
  expect(monitor).toContain('recordQueryMetric');
  expect(monitor).toContain('Slow Firestore query');
  expect(monitor).toContain('sendDefaultPii:false');
  expect(monitor).toContain("privacyMode:'no-default-pii-no-replay'");
  expect(core).toContain('OleiroMonitoring?.recordQueryMetric?.(row)');
  expect(monitor).not.toContain('replayIntegration(');
});

test('staff provisioning never grants coordinator or admin', async () => {
  const pkg=fs.readFileSync('functions/package.json','utf8');
  const tool=fs.readFileSync('functions/tools/create-staff.js','utf8');
  expect(pkg).toContain('admin:create-staff');
  expect(tool).toContain("role!=='activity_assistant'");
  expect(tool).toContain("role:'activity_assistant'");
  expect(tool).toContain('unitIds:[String(unit.id)]');
});
