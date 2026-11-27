import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const release=readFileSync('js/portal/release-notes.js','utf8');
const ui=readFileSync('js/shared/ui.js','utf8');
const build=readFileSync('scripts/build-site.mjs','utf8');
const deploy=readFileSync('.github/workflows/deploy-pages.yml','utf8');
const notes=JSON.parse(readFileSync('release-notes.json','utf8'));

test('production build embeds the page build identity and both portals compare it with the latest deployment',()=>{
  assert.ok(build.includes('window.OLEIRO_BUILD_META=Object.freeze'));
  assert.ok(build.includes('releaseMetadata'));
  const admin=readFileSync('js/admin/release-notes.js','utf8');
  assert.ok(admin.includes('const currentBuild=window.OLEIRO_BUILD_META||meta'));
  assert.ok(admin.includes('latestBuild.commit===currentBuild.commit'));
  assert.ok(admin.includes('checkForNewBuild();'));
  assert.ok(release.includes('const currentBuild=window.OLEIRO_BUILD_META||releaseMeta'));
  assert.ok(release.includes('latestBuild.commit===currentBuild.commit'));
  assert.ok(release.includes('checkForNewBuild();'));
});

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
  assert.ok(release.includes("state?.role!=='volunteer'||!state?.currentSession?.uid"));
  assert.ok(release.includes('pendingPopupAttempts<30'));
  assert.ok(release.includes('waitForVolunteerSession'));
  assert.ok(release.includes("localStorage.getItem(releaseSeenKey())===ANNOUNCEMENT.id"));
  assert.ok(release.includes("onclick=" + '"closeModal()">Entendi'));
  assert.ok(!release.includes("if(!releaseSeen())slides.push(...releaseSlides())"));
});

test('software version menu stays concise and opens the card-based release details',()=>{
  assert.ok(ui.includes('id="info-software"'));
  assert.ok(release.includes('release-info-latest'));
  assert.ok(release.includes('data-release-latest-version'));
  assert.ok(release.includes('Publicado em'));
  assert.ok(release.includes('releaseMeta?.publishedAt||ANNOUNCEMENT.publishedAt'));
  assert.ok(!release.includes('Última atualização'));
  assert.ok(release.includes('openPortalReleaseNotes()'));
  assert.ok(!release.includes('release-history-card'));
});

test('release notes are included in the canonical production build and preserve a versioned history',()=>{
  assert.ok(build.includes("'release-notes.json'"));
  assert.ok(deploy.includes('test -e _site/release-notes.json'));
  assert.ok(deploy.includes('name: github-pages'));
  assert.ok(deploy.includes('artifact_name: github-pages'));
  assert.ok(deploy.includes('actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b'));
  assert.ok(deploy.includes('actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346'));
  assert.ok(!deploy.includes('Remove stale Pages artifacts from previous attempts'));
  assert.ok(deploy.includes('artifact_name: github-pages'));
  assert.ok(Array.isArray(notes.releases));
  assert.ok(notes.releases.length>0);
  for(const row of notes.releases){
    assert.ok(row.id&&row.version&&row.title&&row.summary);
    assert.ok(Array.isArray(row.items));
  }
});
