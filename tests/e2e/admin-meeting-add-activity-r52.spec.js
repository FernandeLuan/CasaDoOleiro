import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('admin meeting planning reinjects replicate and add actions after selection cleanup', async () => {
  const index=fs.readFileSync('admin/index.html','utf8');
  const feature=fs.readFileSync('js/admin/meeting-activity-r52.js','utf8');
  const selection=fs.readFileSync('js/admin/selection-flow-r25.js','utf8');
  const adminFlow=fs.readFileSync('js/admin/refinements-r20.js','utf8');

  expect(index).toContain('meeting-activity-r52.js?v=20260902-r52');
  expect(index.indexOf('meeting-activity-r52.js')).toBeGreaterThan(index.indexOf('selection-flow-r25.js'));
  expect(feature).toContain("p.status==='meeting'");
  expect(feature).toContain('function injectMeetingActions');
  expect(feature).toContain('Replicar atividade');
  expect(feature).toContain('Adicionar atividade');
  expect(feature).toContain('openAdminReplicateActivity');
  expect(feature).toContain('continueAdminReplicateActivity');
  expect(feature).toContain('openAdminPlanningActivity');
  expect(feature).toContain('admin-meeting-empty-action');
  expect(feature).not.toContain('injectMeetingAction');

  /* Regressão r55: selection-flow remove admin-session-manage-actions durante meeting.
     A feature precisa injetar as novas ações somente depois do render base terminar. */
  expect(selection).toContain("modalRoot.querySelectorAll('.admin-session-manage-actions,.admin-create-activity-action,.planning-day-adjust-action').forEach(node=>node.remove())");
  const renderStart=feature.indexOf("renderPersonModal=function(p,tab='overview')");
  const renderBlock=feature.slice(renderStart,feature.indexOf('window.renderPersonModal=renderPersonModal',renderStart));
  expect(renderBlock).toContain('const result=baseRenderPersonModal(p,tab);');
  expect(renderBlock).toContain('injectMeetingActions(p,tab);');
  expect(renderBlock.indexOf('baseRenderPersonModal')).toBeLessThan(renderBlock.indexOf('injectMeetingActions'));

  expect(adminFlow).toContain("window.openAdminPlanningActivity=function");
  expect(adminFlow).toContain('Criada pela gestão e confirmada diretamente no planejamento.');
});
