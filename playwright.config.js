import {defineConfig,devices} from '@playwright/test';

const ci=Boolean(process.env.CI);
const siteRoot=process.env.E2E_SITE_ROOT||'.';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:45_000,
  globalTimeout:ci?12*60_000:0,
  expect:{timeout:10_000},
  fullyParallel:false,
  // Diagnose failures without doubling every failing test's runtime.
  // The full suite remains enabled in both browser projects.
  retries:ci?0:0,
  workers:ci?1:undefined,
  reporter:ci?[
    ['list'],
    ['html',{open:'never'}],
    ['junit',{outputFile:'test-results/results.xml'}]
  ]:'list',
  outputDir:'test-results/artifacts',
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure'
  },
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'iphone-webkit',use:{...devices['iPhone 15']}}
  ],
  webServer:{
    command:`python3 -m http.server 4173 --bind 127.0.0.1 --directory ${JSON.stringify(siteRoot)}`,
    url:'http://127.0.0.1:4173',
    reuseExistingServer:!ci,
    timeout:30_000
  }
});
