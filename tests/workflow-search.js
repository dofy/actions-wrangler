async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const row = (id, name, file) => `<li class="actions-workflow-list-item" data-item-id="${id}"><a class="ActionListContent" href="${root}/workflows/${file}">${name}</a></li>`;
  const pane = `<div data-target="split-page-layout.pane"><ul><li><a class="ActionListContent" href="${root}">All workflows</a></li></ul><ul class="ActionListWrap">${row('1', 'Admin Console', 'backend.yaml')}${row('2', 'Build Service', 'auth-service.yml')}</ul><button class="ActionListContent" id="more">Show more workflows...</button></div>`;
  await page.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: pane }));
  await page.addInitScript(() => {
    window.chrome = { runtime: { sendMessage: () => Promise.resolve() }, storage: { sync: {
      get: (keys, cb) => cb({}), set: (data, cb) => cb()
    } } };
  });
  const wire = async () => page.evaluate(html => {
    const button = document.querySelector('#more');
    window.loadClicks = 0;
    button.onclick = () => {
      window.loadClicks++;
      button.disabled = true;
      setTimeout(() => {
        document.querySelector('.ActionListWrap').insertAdjacentHTML('beforeend', html);
        button.remove();
      }, 600);
    };
  }, row('3', 'Hidden Deploy', 'remote-deploy.yaml'));
  await page.goto(root);
  await wire();
  await page.addScriptTag({ path: 'dist/content.js' });
  const input = page.getByRole('searchbox', { name: 'Search workflows by name or filename' });
  const visible = async expected => page.waitForFunction(expected => {
    const ids = [...document.querySelectorAll('li.actions-workflow-list-item')].filter(r => !r.hidden).map(r => r.dataset.itemId);
    return JSON.stringify(ids) === JSON.stringify(expected);
  }, expected);
  await input.fill('  ADMIN  ');
  await visible(['1']);
  await page.getByRole('status').filter({ hasText: 'Loading all workflows' }).waitFor();
  await page.getByRole('status').filter({ hasText: '1 matching workflow' }).waitFor();
  if (await page.evaluate(() => window.loadClicks) !== 1) throw new Error('Duplicate expansion request');
  await input.fill('AUTH-SERVICE');
  await visible(['2']);
  await input.fill('remote-deploy');
  await visible(['3']);
  await input.fill('missing');
  await visible([]);
  await page.getByRole('status').filter({ hasText: 'No matching workflows' }).waitFor();
  await input.press('Escape');
  await visible(['1', '2', '3']);
  await input.fill('hidden');
  await page.evaluate(({ pane, url }) => {
    history.pushState({}, '', url);
    document.querySelector('[data-target="split-page-layout.pane"]').outerHTML = pane;
    document.dispatchEvent(new Event('turbo:load'));
  }, { pane, url: root + '/workflows/backend.yaml' });
  await wire();
  await page.waitForFunction(() => document.querySelector('input[type=search]')?.value === 'hidden');
  await page.getByRole('status').filter({ hasText: '1 matching workflow' }).waitFor();
  await visible(['3']);
  if (await input.count() !== 1) throw new Error('Duplicate search input');
  await page.evaluate(pane => {
    history.pushState({}, '', '/example/another/actions');
    document.querySelector('[data-target="split-page-layout.pane"]').outerHTML = pane;
    document.dispatchEvent(new Event('turbo:load'));
  }, pane);
  await page.waitForFunction(() => document.querySelector('input[type=search]')?.value === '');
  await visible(['1', '2']);
  // A stuck request must not claim the full list was searched. Accelerate only the deadline clock.
  await page.evaluate(() => {
    const now = Date.now;
    let ticks = 0;
    Date.now = () => now() + ticks++ * 31000;
  });
  await input.fill('missing');
  await page.getByRole('status').filter({ hasText: 'Full list unavailable' }).waitFor();
  await page.getByRole('button', { name: 'Retry loading' }).waitFor();
}
