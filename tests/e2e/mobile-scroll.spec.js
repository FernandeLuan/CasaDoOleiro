import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('mobile document scroll survives viewport changes, modals and navigation',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const links=[...fs.readFileSync('admin/index.html','utf8').matchAll(/<link[^>]*href="(\.\.\/css\/[^"?]+)[^"]*"[^>]*>/g)].map(m=>`<link rel="stylesheet" href="${m[1]}">`).join('');
  await page.route('**/admin/scroll-fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${links}</head><body><div id="app"><div class="admin-shell-r62"><main class="admin-content-r62"><div class="page"><div id="content" style="height:2400px">Scroll fixture</div></div></main></div></div><div id="navRoot"><nav class="bottom-nav">Navigation</nav></div><div id="modalRoot"></div></body></html>`}));
  await page.goto('/admin/scroll-fixture');
  await page.evaluate(()=>{window.state={role:'manager',managerPage:'home'};window.renderManager=()=>{};window.modalRoot=document.getElementById('modalRoot')});
  // Apply the real dynamically installed CSS in production order.
  for(const file of ['admin-shell','account-history','profile-polish','occupancy-page','occupancy-mobile']){
    const source=fs.readFileSync(`js/admin/${file}.js`,'utf8');
    const css=source.match(/style.textContent\s*=\s*`([\s\S]*?)`/)[1];
    await page.addStyleTag({content:css});
  }
  await page.addScriptTag({path:'js/shared/modal-system.js'});
  await page.addScriptTag({path:'js/shared/navigation.js'});
  for(const occupancy of [false,true]){
    await page.evaluate(value=>document.querySelector('.page').classList.toggle('occupancy-page-screen',value),occupancy);
    for(const height of [844,640,844]){
      await page.setViewportSize({width:390,height});
      expect(await page.evaluate(()=>getComputedStyle(document.body).overflowY)).toBe('visible');
      expect(await page.evaluate(()=>getComputedStyle(document.getElementById('app')).overflowY)).toBe('visible');
      await page.evaluate(()=>window.scrollTo(0,700));
      await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(700);
      await page.evaluate(()=>window.scrollBy(0,-300));
      await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(400);
      expect(await page.locator('.bottom-nav').evaluate(el=>Math.abs(el.getBoundingClientRect().bottom-innerHeight))).toBeLessThan(2);
    }
    await page.evaluate(()=>openModal('Test','','<p>Content</p>'));
    expect(await page.evaluate(()=>getComputedStyle(document.body).overflowY)).toBe('hidden');
    await page.evaluate(()=>closeModal());
    expect(await page.evaluate(()=>getComputedStyle(document.body).overflowY)).toBe('visible');
    await page.evaluate(()=>{afterNavigation();window.scrollTo(0,200)});
    await page.waitForTimeout(100);
    expect(await page.evaluate(()=>window.scrollY)).toBe(200);
  }
});
