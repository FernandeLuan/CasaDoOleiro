import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('requested session adjustment has a narrow participant exception', async () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const portal = fs.readFileSync('js/portal/review-flow-r31.js', 'utf8');
  const marker = "resource.data.adminAdjustmentStatus == 'requested'";
  expect(rules).toContain(marker);
  expect(rules).toContain("request.resource.data.adminAdjustmentStatus == 'requested'");
  expect(rules).toContain("request.resource.data.status == resource.data.status");
  expect(rules).toContain("resource.data.status == 'proposed'");
  expect(rules).toContain("participantOwnsEditableLegacy(resource.data)");
  expect(rules).toContain("request.resource.data.diff(resource.data).affectedKeys().hasOnly([");
  expect(rules).toContain("'activityName', 'activityDescription', 'participation', 'materials'");
  expect(rules).toContain("'notes', 'ownerName', 'date', 'time', 'period', 'duration', 'updatedAt'");
  expect(portal).toContain('window.OleiroServices.planning.updateSession(id,proposal)');
});
