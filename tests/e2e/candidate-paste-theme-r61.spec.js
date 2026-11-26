import {test,expect} from '@playwright/test';
import {seedEmulators} from './seed.mjs';

const firebaseConfig={apiKey:'demo-api-key',authDomain:'demo-casadooleiro.firebaseapp.com',projectId:'demo-casadooleiro',appId:'1:123:web:e2e'};
async function login(page,email,password,target){
  await page.addInitScript(()=>localStorage.setItem('oleiro-language','pt'));
  await page.route('**/js/firebase/firebase-config.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.OLEIRO_FIREBASE_CONFIG=${JSON.stringify(firebaseConfig)};`}));
  await page.goto('/?emulator=1');
  await page.waitForFunction(async()=>{try{const context=await window.OleiroFirebase?.ready;return !!context?.configured&&typeof window.OleiroAuth?.signIn==='function'}catch{return false}},{timeout:30_000});
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#loginButton').click();
  await expect(page).toHaveURL(new RegExp(`/${target}/`),{timeout:30_000});
  await page.waitForFunction(()=>typeof window.render==='function',{timeout:20_000});
}

test.beforeEach(async()=>{await seedEmulators()});

test('new volunteer form preserves native text selection and paste gestures on iOS and desktop',async({page})=>{
  test.setTimeout(90_000);
  await login(page,'admin@oleiro.test','Admin123!','admin');
  const volunteerNav=page.getByRole('button',{name:/Voluntariado/}).first();
  await expect(volunteerNav).toBeVisible({timeout:30_000});
  await volunteerNav.click();
  const add=page.getByRole('button',{name:'Novo candidato'});
  await expect(add).toBeVisible({timeout:20_000});
  await add.click();
  const name=page.locator('#ncName1');
  await expect(name).toBeVisible();
  const style=await name.evaluate(el=>{
    const css=getComputedStyle(el);
    return {touchAction:css.touchAction,userSelect:css.userSelect,webkitUserSelect:css.webkitUserSelect,webkitTouchCallout:css.webkitTouchCallout};
  });
  expect(style).toEqual({touchAction:'auto',userSelect:'text',webkitUserSelect:'text',webkitTouchCallout:'default'});
  const paste=await name.evaluate(el=>{
    const data=new DataTransfer();data.setData('text/plain','Texto de teste colado');
    const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data});
    const allowed=el.dispatchEvent(event);
    return {allowed,defaultPrevented:event.defaultPrevented};
  });
  expect(paste).toEqual({allowed:true,defaultPrevented:false});
});

test('volunteer account offers System Light and Dark appearance and persists the selection',async({page})=>{
  test.setTimeout(90_000);
  await login(page,'voluntario@oleiro.test','Volunteer123!','portal');
  const account=page.getByRole('button',{name:/Conta/}).first();
  await expect(account).toBeVisible({timeout:30_000});
  await account.click();
  const system=page.getByRole('button',{name:/Sistema/});
  await expect(system).toBeVisible();
  await expect(page.getByRole('button',{name:/Claro/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Escuro/})).toBeVisible();
  await page.getByRole('button',{name:/Claro/}).click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('oleiro-theme'))).toBe('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference','light');
  await page.getByRole('button',{name:/Sistema/}).click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('oleiro-theme'))).toBe('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference','system');
});
