// Verify both languages in actual bundled content and popup scripts.
async (page) => {
  const root='https://github.com/example/repo/actions';
  const html=`<nav aria-label="Actions workflows"><ul><li><a href="${root}">All workflows</a></li></ul><ul><li data-item-id="build"><a href="${root}/workflows/build.yml">Build</a></li></ul></nav>`;
  await page.route('https://github.com/**', route=>route.fulfill({contentType:'text/html',body:html}));
  await page.addInitScript(()=>{window.fixtureLocale='zh-CN';window.chrome={i18n:{getUILanguage:()=>window.fixtureLocale},runtime:{sendMessage:()=>Promise.resolve()},storage:{sync:{get:(keys,cb)=>cb({}),set:(data,cb)=>cb(),remove:(keys,cb)=>cb()}}};});
  await page.goto(root); await page.addScriptTag({path:'dist/content.js'});
  const input=page.getByRole('searchbox',{name:'按名称或文件名搜索工作流'});
  await input.waitFor(); await page.getByRole('button',{name:'收藏 Build（扩展）'}).waitFor();
  await input.fill('missing'); await page.getByRole('status').filter({hasText:'没有匹配的工作流'}).waitFor();
  await page.getByRole('button',{name:'清除工作流搜索'}).click();
  await page.getByRole('button',{name:'展开全部工作流'}).waitFor();
  await page.setContent('<span data-i18n="auto"></span><button id="resetBtn" data-i18n="reset"></button><input id="autoUnfold"><div id="status"></div>');
  await page.addScriptTag({path:'dist/popup.js'});
  await page.getByText('自动展开',{exact:true}).waitFor();
  if(await page.getByText('清除全部收藏',{exact:true}).count()!==1)throw new Error('Chinese popup missing');
  await page.goto(root); await page.evaluate(()=>{window.fixtureLocale='en-US'}); await page.addScriptTag({path:'dist/content.js'});
  await page.getByRole('searchbox',{name:'Search workflows by name or filename'}).waitFor();
  console.log('PASS: Chinese content, search, clear, popup, and English fallback');
}
