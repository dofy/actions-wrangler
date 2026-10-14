// Run after npm run build:js with playwright-cli run-code "$(cat tests/workflow-navigation.js)".
// Uses a local GitHub-shaped fixture and mocked Chrome storage; no GitHub writes.
async (page) => {
  const root = 'https://github.com/example/repo/actions';
  const row = (id, native = false) => `<li class="actions-workflow-list-item" data-item-id="${id}"><a class="ActionListContent" href="${root}/workflows/${id}.yaml">${id}</a>${native ? '<button class="actions-unpin-button">Native pin</button>' : ''}</li>`;
  const pane = () => `<div data-target="split-page-layout.pane"><ul><li><a class="ActionListContent" href="${root}">All workflows</a></li></ul><ul class="ActionListWrap">${row('native', true)}${row('other')}${row('alpha')}</ul></div>`;
  await page.route('https://github.com/**', route => route.fulfill({
    contentType: 'text/html', body: `<!doctype html><html><body>${pane()}</body></html>`
  }));
  await page.addInitScript(({ root }) => {
    const defaults = {
      autoUnfold: true,
      'pinned:example/repo': ['alpha', 'beta'].map(id => ({ id, name: id, href: `${root}/workflows/${id}.yaml` }))
    };
    const read = () => JSON.parse(localStorage.getItem('fixture-storage') || JSON.stringify(defaults));
    window.chrome = {
      runtime: { sendMessage: () => Promise.resolve() },
      storage: { sync: {
        get: (keys, cb) => queueMicrotask(() => cb(Object.fromEntries(keys.map(key => [key, read()[key]])))),
        set: (data, cb) => { localStorage.setItem('fixture-storage', JSON.stringify({ ...read(), ...data })); queueMicrotask(cb); }
      } }
    };
  }, { root });
  const inject = () => page.addScriptTag({ path: 'dist/content.js' });
  const check = async (label, expected = ['alpha', 'beta', 'native', 'other']) => {
    await page.waitForFunction(expected => {
      const rows = [...document.querySelectorAll('li.actions-workflow-list-item')];
      return JSON.stringify(rows.map(el => el.dataset.itemId)) === JSON.stringify(expected)
        && rows.every(el => el.querySelectorAll('.actions-unfold-pin').length === 1)
        && document.querySelectorAll('.actions-unfold-trigger').length === 1;
    }, expected, { timeout: 5000 });
    console.log(`PASS: ${label}`);
  };
  for (const suffix of ['', '/workflows/auth.yaml', '/workflows/build.yml?query=branch%3Amain']) {
    await page.goto(root + suffix);
    await inject();
    await check(`direct load ${suffix || '/actions'}; hidden pin retained`);
  }
  // Let auto-expand finish: the old implementation disconnected its observer here.
  await page.waitForTimeout(2300);
  await page.evaluate(({ html, url }) => {
    history.pushState({}, '', url);
    document.querySelector('[data-target="split-page-layout.pane"]').outerHTML = html;
  }, { html: pane(), url: root + '/workflows/auth.yaml' });
  await check('sidebar replacement after auto-expand completes');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(html => {
      document.querySelector('[data-target="split-page-layout.pane"]').outerHTML = html;
      document.dispatchEvent(new Event('turbo:frame-load'));
      document.dispatchEvent(new Event('turbo:load'));
    }, pane());
    await check(`Turbo navigation ${i + 1}: no duplicate controls`);
  }
  await page.evaluate(html => document.querySelector('ul.ActionListWrap').insertAdjacentHTML('beforeend', html), row('beta'));
  await check('paginated real row replaces only its own placeholder');
  if (await page.locator('[data-unfold-placeholder]').count()) throw new Error('Duplicate placeholder');
  await page.getByRole('button', { name: 'Unpin beta (extension)', exact: true }).click();
  await page.reload();
  await inject();
  await check('unpin persists after reload', ['alpha', 'native', 'other']);
  await page.getByRole('button', { name: 'Pin other (extension)', exact: true }).click();
  await page.reload();
  await inject();
  await check('pin persists after reload', ['alpha', 'other', 'native']);
  if (await page.getByRole('button', { name: 'Unpin other (extension)', exact: true }).count() !== 1) throw new Error('Pin was not saved');
  await page.goto('https://github.com/example/another/actions');
  await inject();
  await check('repository isolation', ['native', 'other', 'alpha']);
  console.log('All browser regressions passed (fixture DOM, mocked Chrome API).');
}
