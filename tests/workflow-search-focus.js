async (page) => {
  const root = 'https://github.com/example/repo/actions';
  await page.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: `
    <div data-target="split-page-layout.pane"><ul><li><a class="ActionListContent" href="${root}">All workflows</a></li></ul>
    <ul class="ActionListWrap"><li class="actions-workflow-list-item" data-item-id="1"><a class="ActionListContent" href="${root}/workflows/admin.yaml">Admin</a></li></ul>
    <button id="more" class="ActionListContent">Show more workflows...</button></div><input id="other" aria-label="Other input">` }));
  await page.addInitScript(() => {
    window.chrome = { runtime: { sendMessage: () => Promise.resolve() }, storage: { sync: {
      get: (keys, cb) => cb({}), set: (data, cb) => cb()
    } } };
  });
  const open = async () => {
    await page.goto(root);
    await page.addScriptTag({path:'dist/content.js'});
    await page.evaluate(() => {
      document.querySelector('#more').onclick = () => {
        document.querySelector('#more').focus();
        window.expanding = true;
      };
    });
    await page.getByRole('searchbox').fill('admin');
    await page.getByRole('searchbox').press('ArrowLeft');
    await page.waitForFunction(() => window.expanding);
  };
  const focused = async () => page.waitForFunction(() => document.activeElement === document.querySelector('input[type=search]'), undefined, {timeout:1500});
  await open();
  await focused();
  await page.keyboard.insertText('X');
  if (await page.getByRole('searchbox').inputValue() !== 'admiXn') throw new Error('Caret not preserved');
  await page.evaluate(() => {
    const input = document.querySelector('input[type=search]');
    input.setSelectionRange(1,4,'backward');
    document.querySelector('#more').focus();
  });
  await focused();
  const selection = await page.getByRole('searchbox').evaluate(input => [input.selectionStart,input.selectionEnd,input.selectionDirection]);
  if (JSON.stringify(selection)!==JSON.stringify([1,4,'backward'])) throw new Error('Selection lost');
  await page.evaluate(() => document.activeElement.blur());
  await focused();
  // An async response also moves focus, then finishes loading.
  await page.evaluate(() => {
    document.querySelector('.ActionListWrap').insertAdjacentHTML('beforeend','<li class="actions-workflow-list-item" data-item-id="2"><a class="ActionListContent" href="'+location.pathname+'/workflows/second.yaml">Second</a></li>');
    document.querySelector('#more').focus();
    document.querySelector('#more').remove();
  });
  await page.getByRole('status').filter({hasText:'No matching workflows'}).waitFor();
  await focused();
  await page.getByRole('textbox',{name:'Other input'}).click();
  if (!await page.getByRole('textbox',{name:'Other input'}).evaluate(el=>document.activeElement===el)) throw new Error('Focus locked after completion');
  await open();
  await focused();
  await page.getByRole('textbox',{name:'Other input'}).click();
  await page.waitForTimeout(100);
  if (!await page.getByRole('textbox',{name:'Other input'}).evaluate(el=>document.activeElement===el)) throw new Error('Click stolen during loading');
  await open();
  await focused();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  if (await page.getByRole('searchbox').evaluate(el=>document.activeElement===el)) throw new Error('Tab trapped');
}
