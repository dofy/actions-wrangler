async (page) => {
  const root = 'https://github.com/example/repo/actions';
  await page.route('https://github.com/**', route => route.fulfill({contentType:'text/html',body:`
    <div data-target="split-page-layout.pane"><ul><li><a class="ActionListContent" href="${root}">All workflows</a></li></ul>
    <ul class="ActionListWrap"><li class="actions-workflow-list-item" data-item-id="1"><a class="ActionListContent" href="${root}/workflows/admin.yaml">管理后台</a></li></ul>
    <button class="ActionListContent" id="more">Show more workflows...</button></div>`}));
  await page.addInitScript(() => {
    window.chrome={runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{get:(keys,cb)=>cb({}),set:(data,cb)=>cb()}}};
  });
  await page.goto(root);
  await page.addScriptTag({path:'dist/content.js'});
  await page.getByRole('searchbox').focus();
  await page.evaluate(() => {
    window.clicks=0;
    document.querySelector('#more').onclick=()=>{window.clicks++};
    const input=document.querySelector('input[type=search]');
    input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
    input.value='guan';
    input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));
    input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Escape',isComposing:true}));
  });
  await page.waitForTimeout(700);
  if (await page.evaluate(()=>window.clicks)!==0) throw new Error('Expanded during composition');
  if (await page.getByRole('searchbox').inputValue()!=='guan') throw new Error('IME Escape cleared search');
  if (await page.locator('li.actions-workflow-list-item').evaluate(el=>el.hidden)) throw new Error('Filtered uncommitted text');
  await page.evaluate(() => {
    const input=document.querySelector('input[type=search]');
    input.value='管理';
    input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'管理'}));
    input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:false}));
  });
  await page.waitForFunction(()=>window.clicks===1);
  // New composition while pagination is already active: simulate a completed page.
  await page.evaluate(() => {
    const input=document.querySelector('input[type=search]');
    input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
    document.querySelector('.ActionListWrap').insertAdjacentHTML('beforeend','<li class="actions-workflow-list-item" data-item-id="2"><a class="ActionListContent" href="/example/repo/actions/workflows/second.yml">Second</a></li>');
    window.focusCalls=0;
    const focus=input.focus.bind(input);
    input.focus=(...args)=>{window.focusCalls++;focus(...args)};
    input.blur();
  });
  await page.waitForTimeout(700);
  if (await page.evaluate(()=>window.clicks)!==1) throw new Error('Pagination continued during composition');
  if (await page.evaluate(()=>window.focusCalls)!==0) throw new Error('Refocused during composition');
  await page.evaluate(() => {
    const input=document.querySelector('input[type=search]');
    input.value='管理后台';
    input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'管理后台'}));
  });
  await page.waitForFunction(()=>window.clicks===2);
}
