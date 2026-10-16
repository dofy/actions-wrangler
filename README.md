# Actions Wrangler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Chrome extension that helps you tame your GitHub Actions. Pin unlimited workflows beyond GitHub's 5-pin limit and get instant access to your favorites.

![Actions Wrangler Screenshot](assets/screenshot.png)

## Features

- **Unlimited Personal Favorites** - Save workflows using the gray star before each name, independently of GitHub's native pins
- **Organized Sidebar** - Favorites appear above a divider; native pins come first in each section, remaining favorites sort alphabetically, and other workflows retain GitHub's order
- **Workflow Search** - Filter by name or filename, with automatic pagination and input safeguards
- **Updated Actions Layout** - Supports current and legacy sidebars, workflow detail pages, and sidebar replacement during navigation
- **Instant Access** - Pinned workflows appear immediately when the page loads, before GitHub finishes loading the full list
- **Manual Unfold** - Expand all workflows with one click using the unfold button next to "All workflows"
- **Auto Unfold** - Optionally enable automatic expansion of all workflows on page load
- **Per-Repository Pins** - Pins are stored separately for each repository
- **Synced Settings** - Your pins sync across devices via Chrome sync
- **Light/Dark Mode** - Icon automatically adapts to your system theme

## Installation

### From Chrome Web Store

Coming soon!

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/kldavis4/actions-wrangler.git
   cd actions-wrangler
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top right)

5. Click "Load unpacked"

6. Select the `dist` folder

## Usage

### Pinning Workflows

1. Navigate to any GitHub Actions page (`github.com/org/repo/actions`)
2. Click the gray star before a workflow name to save or remove a favorite
3. Filled stars indicate favorites, grouped above a divider
4. GitHub-native pins come first within each section; other favorites sort alphabetically, while other workflows keep their original order
5. Removing a favorite returns it to the lower section; GitHub's native pin button retains its existing behavior

### Searching Workflows

Type a workflow name or filename into **Search workflows…** below “All workflows.” The first search loads remaining workflow pages and reports progress, match counts, and incomplete results with a retry option.

Click **Esc** at the right of the field or press **Escape** to clear the query and restore the list. The button appears only when the field has content, and clearing keeps input focus. The divider disappears when only one section has visible results.

Search preserves scrolling, focus, and selection during loading. IME composition defers filtering and further pagination until text is committed. Queries survive sidebar replacement within a repository and reset when switching repositories; they are not persisted across page reloads.

### Expanding All Workflows

- Click the unfold button next to "All workflows" to expand the full list
- Or enable "Auto Unfold" in the extension popup to expand automatically on page load

### Extension Popup

Click the extension icon to access:
- **Auto Unfold** toggle - Enable/disable automatic workflow expansion
- **Reset All Pinned Workflows** - Clear all extension pins across all repositories

## Development

### Scripts

```bash
npm run build      # Build for production
npm run watch      # Watch mode for development
npm run typecheck  # Run TypeScript type checking
npm run package    # Create distributable zip file
npm run clean      # Remove dist folder
```

### Validation

```bash
npm run typecheck
npm run build
node --test tests/url-matching.cjs
```

Browser fixture regressions cover legacy and current sidebars, favorites and section sorting, pagination, navigation, search, scrolling, focus, and IME events. Commands and limitations are documented in [tests/README.md](tests/README.md). Native OS IME candidate windows are not tested end-to-end.

### Building Icons

If you modify the SVG icons, regenerate the PNGs:

```bash
make clean && make
```

Requires `rsvg-convert` (install via `brew install librsvg` on macOS).

### Project Structure

```
actions-wrangler/
├── src/               # TypeScript source files
│   ├── content.ts     # Main content script
│   ├── search.ts      # Search and input safeguards
│   ├── sidebar.ts     # Shared sidebar selectors and workflow helpers
│   ├── background.ts  # Service worker
│   └── popup.ts       # Popup script
├── assets/            # SVG icons (source)
├── dist/              # Built extension (generated)
├── manifest.json      # Extension manifest
├── popup.html         # Popup UI
└── package.json       # Dependencies & scripts
```

## Permissions

- **storage** - Save pinned workflows and settings (synced via Chrome)
- **tabs** - Update extension icon based on current page
- **Content scripts** - Load a lightweight entry listener on `github.com` so navigation into Actions works without refreshing. The interface starts only on repository Actions pages.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Privacy

This extension does not collect any personal data. See [PRIVACY.md](PRIVACY.md) for details.

## License

MIT
