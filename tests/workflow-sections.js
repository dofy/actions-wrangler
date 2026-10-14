// Two regions, independent native pin priority, alphabetical favorites, stable others.
async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const entries = [['system-star', 'Z System Favorite', true], ['system', 'System Pin', true], ['zebra', 'Zebra'], ['zulu', 'Zulu'], ['alpha', 'Alpha'], ['apple', 'Apple']];
  const row = ([id, name, native]) => `<li data-item-id="${id}"><a href="${root}/workflows/${id}.yml">${name}</a><button aria-label="${native ? 'Unpin' : 'Pin'} ${name}">Native</button></li>`;
  await page.route('https://github.com/**', route => route.fulfill({contentType:'text/html',body:`<nav aria-label="Actions workflows"><ul><li><a href="${root}">All workflows</a></li></ul><ul id="workflows">${entries.map(row).join('')}</ul></nav>`}));
  await page.addInitScript(({root,entries}) => {
    const defaults = {'pinned:example/repo': entries.filter(([id]) => ['system-star','zebra','alpha'].includes(id)).map(([id,name])=>({id,name,href:`${root}/workflows/${id}.yml`}))};
    const read = () => JSON.parse(localStorage.getItem('fixture-storage') || JSON.stringify(defaults));
    window.chrome = {runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{get:(keys,cb)=>queueMicrotask(()=>cb(Object.fromEntries(keys.map(key=>[key,read()[key]])))),set:(data,cb)=>{localStorage.setItem('fixture-storage',JSON.stringify({...read(),...data}));queueMicrotask(cb);}}}};
  },{root,entries});
  const inject = () => page.addScriptTag({path:'dist/content.js'});
  const check = expected => page.waitForFunction(expected => JSON.stringify(Array.from(document.querySelectorAll('#workflows > li[data-item-id]')).map(row=>row.dataset.itemId)) === JSON.stringify(expected), expected);
  await page.goto(root); await inject();
  await check(['system-star','alpha','zebra','system','zulu','apple']);
  if (await page.locator('.actions-wrangler-divider:visible').count() !== 1) throw new Error('Missing section divider');
  await page.getByRole('button',{name:'Pin Apple (extension)',exact:true}).click();
  await check(['system-star','alpha','apple','zebra','system','zulu']);
  await page.getByRole('button',{name:'Unpin Apple (extension)',exact:true}).click();
  await check(['system-star','alpha','zebra','system','zulu','apple']);
  await page.getByRole('button',{name:'Unpin Z System Favorite (extension)',exact:true}).click();
  await check(['alpha','zebra','system-star','system','zulu','apple']);
  const search = page.getByRole('searchbox');
  await search.fill('Alpha');
  if (await page.locator('.actions-wrangler-divider:visible').count()) throw new Error('Orphan divider during search');
  await search.press('Escape');
  if (await page.locator('.actions-wrangler-divider:visible').count() !== 1) throw new Error('Divider not restored');
  await page.getByRole('button',{name:'Unpin Alpha (extension)',exact:true}).click();
  await page.getByRole('button',{name:'Unpin Zebra (extension)',exact:true}).click();
  await check(['system-star','system','zebra','zulu','alpha','apple']);
  if (await page.locator('.actions-wrangler-divider:visible').count()) throw new Error('Divider with empty favorites');
  await page.reload(); await inject();
  await check(['system-star','system','zebra','zulu','alpha','apple']);
  console.log('PASS: section priority, alphabetical favorites, original order restored, search, empty favorites, reload');
}
