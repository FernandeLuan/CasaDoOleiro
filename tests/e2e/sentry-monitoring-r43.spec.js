import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('Sentry monitoring is privacy-safe and catches critical Firebase failures', async () => {
  const monitor = fs.readFileSync('js/shared/monitoring.js', 'utf8');
  const config = fs.readFileSync('js/shared/monitoring-config.js', 'utf8');
  const core = fs.readFileSync('js/services/service-core.js', 'utf8');
  const deploy = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  const portal = fs.readFileSync('portal/index.html', 'utf8');
  const admin = fs.readFileSync('admin/index.html', 'utf8');
  const login = fs.readFileSync('index.html', 'utf8');

  expect(config).toContain("dsn: ''");
  expect(monitor).toContain('sendDefaultPii:false');
  expect(monitor).toContain("'permission-denied'");
  expect(monitor).toContain('beforeSend');
  expect(monitor).toContain("if(event.user)delete event.user");
  expect(monitor).toContain("category.startsWith('ui.')");
  expect(core).toContain('captureServiceError?.(error');
  expect(deploy).toContain('secrets.SENTRY_DSN');
  expect(deploy).toContain("'enabled': bool(dsn)");
  [portal,admin,login].forEach(html=>{
    expect(html).toContain('monitoring-config.js');
    expect(html).toContain('monitoring.js');
  });
  expect(`${monitor} ${config}`).not.toMatch(/https:\/\/[^\s'\"]+@o\d+\.ingest[^\s'\"]+/);
});
