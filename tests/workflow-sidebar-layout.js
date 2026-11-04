// November Sidebar components: div rows, separate nav landmarks, native actions,
// collapsible sidebar, pagination, and legacy saved IDs.
async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const row = (file,name,native=false) => `<div data-component="Sidebar.Item"><a href="${root}/workflows/${file}"><span data-sidebar-collapse-content="true">${name}</span></a><span data-component="Sidebar.Action"><span><button data-component="IconButton" data-size="small" aria-labelledby="tip-${file}">Native</button><span id="tip-${file}">${native?'Unpin':'Pin'} ${name}</span></span></span></div>`;
  const pane = () => `<aside aria-label="Actions" data-expanded="true"><nav aria-label="Workflows" data-component="Sidebar.Main"><div data-component="Sidebar.Section"><div data-component="Sidebar.Item"><a href="${root}">All workflows</a></div></div><div data-component="Sidebar.Section"><div data-component="Sidebar.SectionGroup"><h2>Workflows</h2><div data-component="Sidebar.DisclosurePanel"><div class="items">${row('native.yml','Native',true)}${row('alpha.yaml','Alpha')}${row('build.yml','Build')}<div id="more"><button aria-disabled="false">Show more</button></div></div></div></div></div></nav><nav aria-label="Management"><a href="${root}/caches">Caches</a></nav></aside>`;
  await page.route('https://github.com/**',route=>route.fulfill({contentType:'text/html',body:`<style>[data-component="Sidebar.Item"]{display:flex} a{flex:1;min-width:0}</style>${pane()}`}));
  await page.addInitScript(({root})=>{
    const defaults={'pinned:example/repo':[{id:'1234',name:'Alpha',href:`${root}/workflows/alpha.yaml`},{id:'5678',name:'Hidden',href:`${root}/workflows/hidden.yaml`}]};
    const read=()=>JSON.parse(localStorage.getItem('fixture-storage')||JSON.stringify(defaults));
    window.chrome={runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{get:(keys,cb)=>queueMicrotask(()=>cb(Object.fromEntries(keys.map(k=>[k,read()[k]])))),set:(data,cb)=>{localStorage.setItem('fixture-storage',JSON.stringify({...read(),...data}));queueMicrotask(cb);}}}};
  },{root});
  const wire=()=>page.evaluate(html=>{document.querySelector('#more button').onclick=event=>{event.currentTarget.setAttribute('aria-disabled','true');setTimeout(()=>{document.querySelector('.items').insertAdjacentHTML('beforeend',html);document.querySelector('#more').remove();},150);};},row('hidden.yaml','Hidden'));
  const inject=()=>page.addScriptTag({path:'dist/content.js'});
  const check=()=>page.waitForFunction(()=>document.querySelectorAll('.items .actions-unfold-pin').length===4 && document.querySelectorAll('.actions-workflow-search').length===1 && document.querySelectorAll('.actions-unfold-trigger').length===1);
  for(const path of ['', '/workflows/build.yml']) {
    await page.goto(root+path);await wire();await inject();await check();
    // React replaces className when selection changes; extension layout must
    // survive while native actions retain their intrinsic small-button width.
    const geometry = await page.evaluate(() => {
      const link = document.querySelector('.items a[href$="build.yml"]');
      const row = link.parentElement;
      row.className = 'native-selected-row';
      link.setAttribute('aria-current', 'page');
      const action = row.querySelector('[data-component="Sidebar.Action"]');
      const button = action.querySelector('button');
      return {marker:getComputedStyle(row,'::before').left, nativeMarker:getComputedStyle(link,'::before').display,
        actionWidth:action.getBoundingClientRect().width,buttonWidth:button.getBoundingClientRect().width};
    });
    if (geometry.marker !== '-8px' || geometry.nativeMarker !== 'none') throw new Error('Selection marker drifted after React class replacement');
    if (geometry.actionWidth !== geometry.buttonWidth) throw new Error('Native pin leaves a right-hand gap');
    if(await page.locator('.items li').count())throw new Error('List elements inserted into div sidebar');
    if(await page.getByRole('button',{name:'Unpin Alpha (extension)',exact:true}).count()!==1)throw new Error('Legacy favorite lost');
    const order=await page.locator('.items > [data-component="Sidebar.Item"] a').allTextContents();
    if(JSON.stringify(order.map(text=>text.trim()))!==JSON.stringify(['Alpha','Hidden','Native','Build']))throw new Error('Section order incorrect: '+order);
    await page.evaluate(()=>document.querySelector('aside').dataset.expanded='false');
    if(await page.getByRole('searchbox').isVisible()||await page.getByRole('button',{name:'Unfold all workflows'}).isVisible())throw new Error('Controls overflow collapsed sidebar');
    await page.evaluate(()=>document.querySelector('aside').dataset.expanded='true');
    await page.getByRole('searchbox').fill('hidden.yaml');
    await page.getByRole('status').filter({hasText:'1 matching workflow'}).waitFor();
    if(await page.locator('[data-unfold-placeholder]').count())throw new Error('Loaded favorite duplicated');
    if(await page.locator('.actions-wrangler-divider:visible').count())throw new Error('Orphan divider');
    await page.getByRole('button',{name:'Clear workflow search'}).click();
    if(await page.getByRole('button',{name:'Clear workflow search'}).isVisible())throw new Error('Esc clear still visible');
  }
  await page.getByRole('button',{name:'Pin Build (extension)',exact:true}).click();
  await page.reload();await wire();await inject();await check();
  if(await page.getByRole('button',{name:'Unpin Build (extension)',exact:true}).count()!==1)throw new Error('Favorite persistence failed');
  await page.evaluate(html=>document.querySelector('aside').outerHTML=html,pane());
  await wire();await check();
  if(await page.locator('.items .actions-unfold-pin').count()!==4)throw new Error('React replacement lost controls');
  console.log('PASS: Sidebar div layout, native pins, overview/detail, placeholders, pagination, search/clear, collapsed sidebar, persistence and replacement');
}
