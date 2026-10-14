// Semantic React sidebar fixture: no legacy classes, numeric IDs, or split-page-layout.
async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const row = (file, name, native = false) => `<li class="new-item"><a href="${root}/workflows/${file}"><span>${name}</span></a><span data-component="ActionList.TrailingAction"><button aria-labelledby="tooltip-${file}">Native</button><span id="tooltip-${file}" data-component="Tooltip" aria-hidden="true">${native ? 'Unpin' : 'Pin'} ${name}</span></span></li>`;
  const pane = () => `<nav aria-label="Actions workflows"><ul><li><a href="${root}">All workflows</a></li><li><h3 id="workflow-heading">Workflows</h3><ul aria-label="Workflows" aria-labelledby="workflow-heading">${row('native.yml', 'Native', true)}${row('alpha.yaml', 'Alpha')}${row('build.yml', 'Build')}<li><button id="more" aria-disabled="false">Show more</button></li></ul></li></ul></nav>`;
  await page.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: pane() }));
  await page.addInitScript(({root}) => {
    const defaults = {'pinned:example/repo': [{id:'1234',name:'Alpha',href:`${root}/workflows/alpha.yaml`}, {id:'5678',name:'Hidden',href:`${root}/workflows/hidden.yaml`}]};
    const read = () => JSON.parse(localStorage.getItem('fixture-storage') || JSON.stringify(defaults));
    window.chrome = {runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{
      get:(keys,cb)=>queueMicrotask(()=>cb(Object.fromEntries(keys.map(key=>[key,read()[key]])))),
      set:(data,cb)=>{localStorage.setItem('fixture-storage',JSON.stringify({...read(),...data}));queueMicrotask(cb);}
    }}};
  }, {root});
  const wire = () => page.evaluate(html => {
    document.querySelector('#more').onclick = event => {
      const button = event.currentTarget;
      button.setAttribute('aria-disabled', 'true');
      setTimeout(()=>{document.querySelector('ul[aria-label="Workflows"]').insertAdjacentHTML('beforeend',html);button.closest('li').remove();},600);
    };
  }, row('hidden.yaml', 'Hidden'));
  const inject = () => page.addScriptTag({path:'dist/content.js'});
  const check = () => page.waitForFunction(() => {
    const list = document.querySelector('ul[aria-label="Workflows"]');
    return list.querySelectorAll('li:has(a)').length === 4 && list.querySelectorAll('.actions-unfold-pin').length === 4
      && document.querySelectorAll('.actions-unfold-trigger').length === 1
      && document.querySelectorAll('.actions-workflow-search').length === 1;
  });
  await page.goto(root); await wire(); await inject(); await check();
  if (await page.getByRole('button',{name:'Unpin Alpha (extension)',exact:true}).count() !== 1) throw new Error('Legacy numeric pin lost');
  const search = page.getByRole('searchbox');
  await search.fill('hidden.yaml');
  await page.getByRole('status').filter({hasText:'1 matching workflow'}).waitFor();
  await check();
  if (await page.locator('[data-unfold-placeholder]').count()) throw new Error('Duplicate loaded pin');
  if (await page.locator('ul[aria-label="Workflows"] > li:visible').count() !== 1) throw new Error('Search included parent group');
  await search.press('Escape');
  await page.getByRole('button',{name:'Pin Build (extension)',exact:true}).click();
  await page.reload(); await wire(); await inject(); await check();
  if (await page.getByRole('button',{name:'Unpin Build (extension)',exact:true}).count() !== 1) throw new Error('New filename pin not persisted');
  await page.getByRole('button',{name:'Unpin Alpha (extension)',exact:true}).click();
  await page.reload(); await wire(); await inject(); await check();
  if (await page.getByRole('button',{name:'Pin Alpha (extension)',exact:true}).count() !== 1) throw new Error('Legacy pin unpin failed');
  await page.evaluate(html => document.querySelector('nav').outerHTML=html, pane());
  await wire(); await check();
  if (await page.locator('ul[aria-label="Workflows"] > li').first().getByRole('link').innerText() !== 'Build') throw new Error('Favorite alphabetical order changed');
  console.log('PASS: modern sidebar, nested groups, old pins, pagination, search, new pins, reload, React replacement');
}
