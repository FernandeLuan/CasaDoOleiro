import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('submitted candidate planning stays editable and shared by application participants', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const domainRules=fs.readFileSync('js/shared/domain-rules.js','utf8');
  const planning=fs.readFileSync('js/portal/planejamento.js','utf8');
  const app=fs.readFileSync('js/portal/app.js','utf8');
  const portalHtml=fs.readFileSync('portal/index.html','utf8');
  const enhancements=fs.readFileSync('js/portal/planning-enhancements.js','utf8');
  const adjustment=fs.readFileSync('js/portal/candidate-adjustment.js','utf8');

  expect(rules).toContain("app.status in ['pending', 'analysis', 'adjustments']");
  expect(rules).toContain("app.participantUids.hasAny([data.createdByUid])");
  expect(rules).toContain("candidateEditable(resource.data.applicationId)");
  expect(domainRules).toContain("['draft','submitted','adjustments']");
  expect(planning).toContain('candidatePlanningEditable(status)');
  expect(planning).toContain('volunteerAgendaContent(editable)');
  expect(app).toContain('OleiroRules?.candidatePlanningEditable');
  expect(portalHtml).toContain('../js/shared/domain-rules.js');
  expect(portalHtml).not.toContain('../js/portal/candidate-view.js');
  expect(enhancements).not.toMatch(/volunteerPlan\s*=\s*function/);
  expect(adjustment).not.toContain("if(id&&scopedAdjustment()&&!isDraftActivity(id))return showToast");
  expect(rules).toContain("!('managerCreated' in data) || data.managerCreated != true");
});

test('monitoring catches asset failures and avoids cold-start Firestore noise', async () => {
  const monitoring=fs.readFileSync('js/shared/monitoring.js','utf8');
  const core=fs.readFileSync('js/services/service-core.js','utf8');
  expect(monitoring).toContain('asset_load_failed');
  expect(monitoring).toContain('slowQuerySeen');
  expect(monitoring).toContain('coldStart&&durationMs<8000');
  expect(core).toContain('performance.now()<10000');
});
