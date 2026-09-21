const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const matches = manifest.content_scripts[0].matches.map(pattern => new RegExp(
  '^' + pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'
));
let onUpdated;
let icon;
vm.runInNewContext(fs.readFileSync('dist/background.js', 'utf8'), { chrome: {
  runtime: { onMessage: { addListener() {} } },
  tabs: { onActivated: { addListener() {} }, onUpdated: { addListener(fn) { onUpdated = fn; } } },
  action: { setIcon(value) { icon = value; return Promise.resolve(); } }
} });
for (const suffix of ['', '/', '?query=branch%3Amain', '/workflows/build.yml', '/workflows/auth.yaml', '/workflows/auth.yaml?query=branch%3Amain', '/runs/123']) {
  test(`injection and active icon: /actions${suffix}`, () => {
    const url = `https://github.com/example/repo/actions${suffix}`;
    assert.ok(matches.some(pattern => pattern.test(url)));
    onUpdated(1, { url }, { url });
    assert.equal(icon.path[16], 'icon16.png');
  });
}
test('unrelated URLs keep inactive icon', () => {
  for (const url of ['https://github.com/example/repo/pulls', 'https://github.com/example/repo/actions-other', 'https://example.com/example/repo/actions']) {
    assert.ok(!matches.some(pattern => pattern.test(url)));
    onUpdated(1, { url }, { url });
    assert.equal(icon.path[16], 'icon16-grey.png');
  }
});
