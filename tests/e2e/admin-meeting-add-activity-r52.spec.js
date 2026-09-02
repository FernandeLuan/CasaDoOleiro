import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('admin meeting profile exposes explicit add activity action', async () => {
  const index=fs.readFileSync('admin/index.html','utf8');
  const feature=fs.readFileSync('js/admin/meeting-activity-r52.js','utf8');
  const adminFlow=fs.readFileSync('js/admin/refinements-r20.js','utf8');

  expect(index).toContain('meeting-activity-r52.js?v=20260902-r52');
  expect(index.indexOf('meeting-activity-r52.js')).toBeGreaterThan(index.indexOf('review-flow-r32.js'));
  expect(feature).toContain("p.status==='meeting'");
  expect(feature).toContain('Adicionar atividade');
  expect(feature).toContain('openAdminMeetingActivityPicker');
  expect(feature).toContain('openAdminPlanningActivity');
  expect(feature).toContain("tab!=='overview'");
  expect(adminFlow).toContain("window.openAdminPlanningActivity=function");
  expect(adminFlow).toContain('Criada pela gestão e confirmada diretamente no planejamento.');
});
