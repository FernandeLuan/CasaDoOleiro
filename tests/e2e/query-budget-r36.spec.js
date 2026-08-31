import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('selection transitions derive activity refs without a second Firestore query',async()=>{
  const source=fs.readFileSync('js/services/selection-flow-r25-service.js','utf8');
  const start=source.indexOf('async function planningDocs');
  const end=source.indexOf('function ensureBatchSize',start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const block=source.slice(start,end);
  expect(block).toContain("collection(context.db,'activity_sessions')");
  expect(block).toContain('derivedActivityRefs');
  expect(block).not.toContain("collection(context.db,'activities')");
});
