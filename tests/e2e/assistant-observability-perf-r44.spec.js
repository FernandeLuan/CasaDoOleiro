import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('assistant stays unit-scoped and can run candidate lifecycle', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const ui=fs.readFileSync('js/admin/activity-assistant-r31.js','utf8');
  const apps=fs.readFileSync('js/services/application-service.js','utf8');
  expect(rules).toContain('assistantMayManageApplication');
  expect(rules).toContain('assistantMayManageVolunteerUser');
  expect(rules).toContain('resource.data.unitIds.hasAny(currentUser().unitIds)');
  expect(ui).toContain('assistantUnitLabel');
  expect(ui).not.toContain("['approveCandidate','rejectCandidate','reactivateCandidate'");
  expect(apps).toContain("async listOccupancyMonth(month,{unitId='all'}={})");
  expect(apps).toContain("firestore.where('unitId','==',normalizedUnit)");
});

test('monitoring includes slow-query, tracing and privacy-safe error replay', async () => {
  const monitoring=fs.readFileSync('js/shared/monitoring.js','utf8');
  const core=fs.readFileSync('js/services/service-core.js','utf8');
  expect(monitoring).toContain('captureSlowQuery');
  expect(monitoring).toContain('tracesSampleRate:0.1');
  expect(monitoring).toContain('replaysOnErrorSampleRate:0.1');
  expect(monitoring).toContain('maskAllText:true');
  expect(core).toContain('captureSlowQuery?.(row)');
});
