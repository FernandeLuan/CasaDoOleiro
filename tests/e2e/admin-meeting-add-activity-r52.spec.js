import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('admin meeting planning exposes replicate and add actions inside approved activities', async () => {
  const index=fs.readFileSync('admin/index.html','utf8');
  const feature=fs.readFileSync('js/admin/meeting-activity-r52.js','utf8');
  const adminFlow=fs.readFileSync('js/admin/refinements-r20.js','utf8');

  expect(index).toContain('meeting-activity-r52.js?v=20260902-r52');
  expect(index.indexOf('meeting-activity-r52.js')).toBeGreaterThan(index.indexOf('review-flow-r32.js'));
  expect(feature).toContain("p.status==='meeting'");
  expect(feature).toContain('adminPlanningDayCard=function');
  expect(feature).toContain('Replicar atividade');
  expect(feature).toContain('Adicionar atividade');
  expect(feature).toContain('openAdminReplicateActivity');
  expect(feature).toContain('continueAdminReplicateActivity');
  expect(feature).toContain('openAdminPlanningActivity');
  expect(feature).toContain("modalRoot.querySelectorAll('.admin-meeting-add-activity').forEach(node=>node.remove())");
  expect(feature).not.toContain('injectMeetingAction');
  expect(adminFlow).toContain("window.openAdminPlanningActivity=function");
  expect(adminFlow).toContain('Criada pela gestão e confirmada diretamente no planejamento.');
});