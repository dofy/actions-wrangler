async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const row = id => `<li class="actions-workflow-list-item" data-item-id="${id}" style="height:40px"><a class="ActionListContent" href="${root}/workflows/${id}.yaml">Workflow ${id}</a></li>`;
  await page.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: `
    <div style="height:500px"></div>
    <div data-target="split-page-layout.pane" style="height:250px;overflow:auto;width:350px">
      <ul><li><a class="ActionListContent" href="${root}">All workflows</a></li></ul>
      <ul class="ActionListWrap">${Array.from({length:20}, (_,i)=>row(i)).join('')}</ul>
      <button class="ActionListContent" id="more">Show more workflows...</button>
    </div><div style="height:1200px"></div>` }));
  await page.addInitScript(() => {
    window.chrome = { runtime: { sendMessage: () => Promise.resolve() }, storage: { sync: {
      get: (keys, cb) => cb({}), set: (data, cb) => cb()
    } } };
  });
  const open = async () => {
    await page.goto(root);
    await page.addScriptTag({path:'dist/content.js'});
    await page.evaluate(() => window.scrollTo(0,400));
  };
  await open();
  await page.evaluate(html => {
    const button = document.querySelector('#more');
    button.onclick = () => {
      button.disabled = true;
      button.scrollIntoView();
      setTimeout(() => {
        document.querySelector('.ActionListWrap').insertAdjacentHTML('beforeend',html);
        button.scrollIntoView();
        button.remove();
      },400);
    };
  },row(20));
  await page.getByRole('searchbox').fill('workflow');
  const before = await page.evaluate(() => ({y:window.scrollY, top:document.querySelector('[data-target="split-page-layout.pane"]').scrollTop}));
  await page.getByRole('status').filter({hasText:'21 matching workflows'}).waitFor();
  const after = await page.evaluate(() => ({y:window.scrollY, top:document.querySelector('[data-target="split-page-layout.pane"]').scrollTop}));
  if (JSON.stringify(before)!==JSON.stringify(after)) throw new Error(`Scroll moved: ${JSON.stringify({before,after})}`);
  const box = await page.getByRole('searchbox').boundingBox();
  if (!box || box.y<0 || box.y+box.height>await page.evaluate(()=>innerHeight)) throw new Error('Search not visible');
  // Protection must end when loading ends.
  await page.evaluate(() => document.querySelector('[data-target="split-page-layout.pane"]').scrollTop=160);
  await page.waitForTimeout(100);
  if (await page.evaluate(() => document.querySelector('[data-target="split-page-layout.pane"]').scrollTop)!==160) throw new Error('Scroll locked after completion');
  await open();
  await page.evaluate(() => document.querySelector('#more').onclick=()=>{});
  await page.getByRole('searchbox').fill('workflow');
  await page.getByRole('status').filter({hasText:'Loading all workflows'}).waitFor();
  await page.locator('[data-target="split-page-layout.pane"]').hover();
  await page.mouse.wheel(0,160);
  await page.waitForFunction(() => document.querySelector('[data-target="split-page-layout.pane"]').scrollTop>0);
  await page.waitForTimeout(100);
  if (await page.evaluate(() => document.querySelector('[data-target="split-page-layout.pane"]').scrollTop)===0) throw new Error('User scroll was blocked');
}
