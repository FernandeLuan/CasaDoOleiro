import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const release=readFileSync('js/portal/release-notes.js','utf8');
const ui=readFileSync('js/shared/ui.js','utf8');
const build=readFileSync('scripts/build-site.mjs','utf8');
const deploy=readFileSync('.github/workflows/deploy-pages.yml','utf8');
const notes=JSON.parse(readFileSync('release-notes.json','utf8'));

test('activity notice dismissal is persisted per authenticated volunteer',()=>{
  assert.ok(release.includes('dismissedHomeNoticeKey()'));
  assert.ok(release.includes('ensureDismissedHomeNotices()'));
  assert.ok(release.includes('localStorage.setItem(dismissedHomeNoticeKey()'));
  assert.ok(release.includes('hideHomeNotice(slide.id)'));
  assert.ok(release.includes('releaseDismissedInSessionId===ANNOUNCEMENT.id'));
  assert.ok(release.includes('releaseDismissedInSessionId=ANNOUNCEMENT.id'));
});

test('a new release opens the existing change-summary modal once and is dismissed by release ID',()=>{
  assert.ok(release.includes("const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-')"));
  assert.ok(release.includes('let pendingReleasePopupId=null;'));
  assert.ok(release.includes('function maybeOpenPendingReleasePopup()'));
  assert.ok(release.includes('pendingReleasePopupId=ANNOUNCEMENT.id;'));
  assert.ok(release.includes('maybeOpenPendingReleasePopup()},60)'));
  assert.ok(release.includes("else if(state?.volunteerPage!=='home'&&ANNOUNCEMENT.id===pendingId)pendingReleasePopupId=pendingId"));
  assert.ok(release.includes("localStorage.getItem(releaseSeenKey())===ANNOUNCEMENT.id"));
  assert.ok(release.includes("onclick=" + '"closeModal()">Entendi'));
  assert.ok(!release.includes("if(!releaseSeen())slides.push(...releaseSlides())"));
});

test('software version accordion contains the latest release summary and link to details',()=>{
  assert.ok(ui.includes('id="info-software"'));
  assert.ok(release.includes('release-info-latest'));
  assert.ok(release.includes('data-release-latest-version'));
  assert.ok(release.includes('data-release-latest-summary'));
  assert.ok(release.includes('Última atualização'));
  assert.ok(release.includes('openPortalReleaseNotes()'));
  assert.ok(!release.includes('release-history-card'));
});

test('release notes are included in the canonical production build and preserve a versioned history',()=>{
  assert.ok(build.includes("'release-notes.json'"));
  assert.ok(deploy.includes('test -e _site/release-notes.json'));
  assert.ok(deploy.includes('name: github-pages'));
  assert.ok(deploy.includes('artifact_name: github-pages'));
  assert.ok(deploy.includes('Remove stale Pages artifacts from previous attempts'));
  assert.ok(deploy.includes('actions: write'));
  assert.ok(Array.isArray(notes.releases));
  assert.ok(notes.releases.length>0);
  for(const row of notes.releases){
    assert.ok(row.id&&row.version&&row.title&&row.summary);
    assert.ok(Array.isArray(row.items));
  }
});
