import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('assistant stays unit-scoped and can run candidate lifecycle', async () => {
  const rules=fs.readFileSync('firestore.rules','utf8');
  const ui=fs.readFileSync('js/admin/activity-assistant-r31.js','utf8');
  const apps=fs.readFileSync('js/services/application-service.js','utf8');
  const scoped=fs.readFileSync('js/services/review-flow-r31-service.js','utf8');
  const groups=fs.readFileSync('js/services/group-service.js','utf8');
  expect(rules).toContain('assistantMayManageApplication');
  expect(rules).toContain('assistantMayManageVolunteerUser');
  expect(rules).toContain('resource.data.unitIds.hasAny(currentUser().unitIds)');
  expect(rules).toContain('isActivityAssistant() && assistantHasUnit(resource.data.unitId)');
  expect(ui).toContain('assistantUnitLabel');
  expect(ui).not.toContain("['approveCandidate','rejectCandidate','reactivateCandidate'");
  expect(apps).toContain("async listOccupancyMonth(month,{unitId='all'}={})");
  expect(apps).toContain("firestore.where('unitId','==',normalizedUnit)");
  expect(scoped).toContain("services.applications.list=async function(args={}){const unit=assistantUnit();return baseApplicationsList({...args,...(unit?{unit}: {})})}");
  expect(scoped).toContain("firestore.where('unitId','==',forced),firestore.where('status','==','approved')");
  expect(scoped).toContain("firestore.where('unitId','==',forced),firestore.where('status','==','change_requested')");
  expect(scoped).toContain("services.planning.listManagerSchedule=async function(args={}){const forced=assistantUnit();return baseManagerSchedule({...args,...(forced?{unitId:forced}: {})})}");
  expect(groups).toContain('services.accessScope?.forceUnit?.(requested)');
  expect(groups).toContain("monitor:{area:'groups',action:'list_unit',unitId:normalized}");
});

test('assistant dashboard indexes match the exact Firestore query order', async () => {
  const indexes=JSON.parse(fs.readFileSync('firestore.indexes.json','utf8')).indexes;
  const signature=index=>index.fields.map(field=>`${field.fieldPath}:${field.order||field.arrayConfig}`).join('|');
  const signatures=new Set(indexes.filter(index=>index.collectionGroup==='applications').map(signature));
  expect(signatures.has('status:ASCENDING|unitId:ASCENDING|stayStart:ASCENDING')).toBeTruthy();
  expect(signatures.has('status:ASCENDING|unitId:ASCENDING|stayEnd:ASCENDING')).toBeTruthy();
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
