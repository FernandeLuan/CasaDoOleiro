import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('meeting stage exposes only new activity proposals while keeping approved planning locked', async () => {
  const portal=fs.readFileSync('portal/index.html','utf8');
  const feature=fs.readFileSync('js/portal/meeting-activity-r51.js','utf8');
  const selection=fs.readFileSync('js/portal/selection-flow-r25.js','utf8');

  expect(selection).toContain("state.currentApplication?.status==='meeting'");
  expect(selection).toContain('volunteerAgendaContent(false)');
  expect(feature).toContain("state.currentApplication?.status==='meeting'");
  expect(feature).toContain('return baseAgenda(true)');
  expect(feature).toContain("activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments'");
  expect(feature).toContain('postApprovalProposal=proposalMode&&(!id||proposalEditable(existing))');
  expect(feature).toContain("if(id&&!proposalEditable(activity))return showToast(t('portal.activity.adjustLocked'))");
  expect(feature).toContain("onclick=\"navigateVolunteer('plan')\"");

  const selectionAt=portal.indexOf('selection-flow-r25.js');
  const r51At=portal.indexOf('meeting-activity-r51.js');
  expect(selectionAt).toBeGreaterThan(-1);
  expect(r51At).toBeGreaterThan(selectionAt);
});

test('Firestore permits proposals in meeting without unlocking existing approved-plan changes', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');

  expect(rules).toContain("return app.active == true && app.status in ['meeting', 'approved'];");

  const creates=rules.slice(rules.indexOf('function createsApprovedProposal'),rules.indexOf('function updatesApprovedProposal'));
  expect(creates).toContain('proposalApplication(data.applicationId)');

  const updates=rules.slice(rules.indexOf('function updatesApprovedProposal'),rules.indexOf('function participantSubmitsSessionAdjustment'));
  expect(updates).toContain('proposalApplication(resource.data.applicationId)');

  const changeRequest=rules.slice(rules.indexOf('function participantRequestsApprovedChange'),rules.indexOf('function participantResubmitsApprovedChange'));
  expect(changeRequest).toContain('approvedApplication(resource.data.applicationId)');
  expect(changeRequest).not.toContain('proposalApplication(resource.data.applicationId)');

  const resubmit=rules.slice(rules.indexOf('function participantResubmitsApprovedChange'),rules.indexOf('match /users/{uid}'));
  expect(resubmit).toContain('approvedApplication(resource.data.applicationId)');
  expect(resubmit).not.toContain('proposalApplication(resource.data.applicationId)');
});
