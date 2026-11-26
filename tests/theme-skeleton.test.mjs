import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('system appearance is the default and supports explicit light/dark overrides', () => {
  const state = read('../js/shared/state.js');
  const theme = read('../js/shared/theme-preference.js');
  const settings = read('../js/admin/account-settings.js');
  assert.match(state, /themePreference:[^\n]*'system'/);
  assert.match(theme, /prefers-color-scheme: dark/);
  assert.match(theme, /setThemePreference/);
  assert.match(theme, /localStorage\.setItem\('oleiro-theme',value\)/);
  assert.match(settings, /setAdminTheme\('system'\)/);
  assert.match(settings, /setAdminTheme\('light'\)/);
  assert.match(settings, /setAdminTheme\('dark'\)/);
});

test('admin and portal load the shared theme and skeleton components', () => {
  for (const path of ['../admin/index.html', '../portal/index.html']) {
    const html = read(path);
    assert.match(html, /theme-preference\.js/);
    assert.match(html, /skeleton\.js/);
    assert.match(html, /loading\.css\?v=skeleton-system-1/);
  }
});

test('skeleton component supports dashboard and card placeholders and reduced motion', () => {
  const js = read('../js/shared/skeleton.js');
  const css = read('../css/loading.css');
  assert.match(js, /OleiroSkeleton/);
  assert.match(js, /dashboard/);
  assert.match(js, /aria-busy/);
  assert.match(css, /oleiro-skeleton-shimmer/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('volunteer account exposes System, Light and Dark appearance controls', () => {
  const profile = read('../js/portal/product-current.js');
  const theme = read('../js/shared/theme-preference.js');
  const portalCss = read('../css/portal.css');
  assert.match(profile, /setPortalTheme/);
  assert.ok(profile.includes("setPortalTheme('system')"));
  assert.ok(profile.includes("setPortalTheme('light')"));
  assert.ok(profile.includes("setPortalTheme('dark')"));
  assert.match(theme, /prefers-color-scheme: dark/);
  assert.ok(portalCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
});
