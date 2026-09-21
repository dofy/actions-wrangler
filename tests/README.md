# Local regression checks

```sh
npm ci
npm run typecheck
npm run build
node --test tests/url-matching.cjs
```

`url-matching.cjs` checks manifest URL patterns and executes the bundled background
script with a Chrome API stub. It covers `.yml`, `.yaml`, query strings, run pages,
and unrelated URLs. Pattern checks are not a substitute for Chrome's loader.

To run the browser regression with Playwright CLI (from the repository root):

```sh
npx --package @playwright/cli playwright-cli -s=workflow-regression open about:blank
npx --package @playwright/cli playwright-cli -s=workflow-regression run-code "$(cat tests/workflow-navigation.js)"
npx --package @playwright/cli playwright-cli -s=workflow-regression close
```

Use a fresh browser session for each run. The script intercepts GitHub requests
with a small sidebar fixture, injects the built content script, and mocks the
Chrome storage/runtime APIs. It makes no authenticated GitHub changes and does
not test installation of the packaged extension in Chrome.

Covered cases:

- Direct Actions, `.yaml`, and `.yml` pages with query parameters.
- Sidebar replacement after auto-unfold finishes, with and without Turbo events.
- Repeated Turbo navigation without duplicate stars or unfold buttons.
- Hidden pinned workflows retained while only some real rows are loaded.
- Paginated real rows replacing only their corresponding placeholders.
- Stable pin order after native GitHub pins.
- Pin/unpin persistence after reload and per-repository isolation.

For a manual extension smoke test, load `dist/` unpacked in a separate Chrome
profile, pin workflows with the extension stars, visit both `.yaml` and `.yml`
workflow pages, refresh, and navigate back. Verify the stars and personal pins
remain, including pins hidden behind "Show more workflows". Repeat with auto-unfold
on and off.

## Search regression

In a fresh Playwright CLI session, run `tests/workflow-search.js` using the same
`run-code` command above. It covers name and filename matching, case and whitespace,
a delayed pagination response, no duplicate load requests, empty results, Escape
to clear, sidebar replacement, repository changes, and incomplete-loading feedback.
The existing navigation suite also checks that search does not break personal pins.

`tests/workflow-search-scroll.js` exercises nested sidebar and document scrolling
triggered both on load-more click and after its async response. It verifies the
search remains visible, normal scrolling resumes after loading, and a real user
wheel gesture is respected during loading. Run in a fresh CLI session as above.

`tests/workflow-search-focus.js` reproduces load-more stealing input focus. It
checks continued typing at the same caret, backward selections, blur to the body,
async completion, and intentional pointer/Tab focus changes during loading.
The unpatched search implementation fails its first focus assertion.

`tests/workflow-search-ime.js` simulates composition events: no filtering or
pagination until text is committed, IME Escape is not treated as clearing search,
ongoing pagination pauses, and focus restoration does not run during composition.
This covers browser event handling, not an end-to-end native OS candidate window.
