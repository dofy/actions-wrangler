// Start outside Actions and use same-document links, just like GitHub Turbo.
async (page) => {
  const root = 'https://github.com/example/repo';
  const actions = `<nav aria-label="Actions workflows"><ul><li><a href="${root}/actions">All workflows</a></li></ul><ul><li><a href="${root}/actions/workflows/build.yml">Build</a></li></ul></nav>`;
  await page.route('https://github.com/**', route => route.fulfill({contentType:'text/html',body:`<main><a href="${root}/actions" id="enter">Actions</a></main>`}));
  await page.addInitScript(() => {
    window.fixtureDocument = Math.random();
    window.chrome = {runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{get:(keys,cb)=>queueMicrotask(()=>cb({})),set:(data,cb)=>queueMicrotask(cb)}}};
  });
  await page.goto(root);
  const documentId = await page.evaluate(() => window.fixtureDocument);
  await page.addScriptTag({path:'dist/content.js'});
  if (await page.locator('.actions-workflow-search, .actions-unfold-pin').count()) throw new Error('Controls on non-Actions page');
  await page.evaluate(({actions,root})=>{
    document.querySelector('#enter').onclick = event => {
      event.preventDefault(); history.pushState({},'',root+'/actions');
      document.querySelector('main').innerHTML=actions;
      document.dispatchEvent(new Event('turbo:load'));
    };
  },{actions,root});
  await page.locator('#enter').click();
  const check = async () => {
    await page.getByRole('searchbox').waitFor();
    await page.getByRole('button',{name:'Pin Build (extension)',exact:true}).waitFor();
    if (await page.locator('.actions-workflow-search').count() !== 1 || await page.locator('.actions-unfold-pin').count() !== 1) throw new Error('Duplicate controls');
    if (await page.evaluate(() => window.fixtureDocument) !== documentId) throw new Error('Unexpected document reload');
  };
  await check();
  for (let i=0;i<2;i++) {
    await page.evaluate(root=>{history.pushState({},'',root+'/pulls');document.querySelector('main').innerHTML='<h1>Pull requests</h1>';document.dispatchEvent(new Event('turbo:load'));},root);
    if (await page.locator('.actions-workflow-search, .actions-unfold-pin').count()) throw new Error('Controls outside Actions');
    // Return without a Turbo event to exercise the DOM observer fallback.
    await page.evaluate(({root,actions})=>{history.pushState({},'',root+'/actions/workflows/build.yml');document.querySelector('main').innerHTML=actions;},{root,actions});
    await check();
  }
  console.log('PASS: non-Actions entry, no document reload, exit/re-entry, DOM observer fallback, no duplicates');
}
