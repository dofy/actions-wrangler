# Actions Wrangler

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/dofy/actions-wrangler)](https://github.com/dofy/actions-wrangler/releases/latest)

Personal workflow pins and search for GitHub Actions. Find workflows by name or filename, keep your favorites in a separate top section, and use them across Actions overview and workflow pages.

This is a community fork of [kldavis4/actions-wrangler](https://github.com/kldavis4/actions-wrangler), with workflow-page pinning fixes and a searchable sidebar. Download this fork from [GitHub Releases](https://github.com/dofy/actions-wrangler/releases/latest); the upstream Chrome Web Store listing is a separate distribution.

## Features

- **Personal favorites:** Use the gray star before each workflow name to save favorites without changing GitHub's native pins. No five-pin limit; preferences are saved per repository. Filled stars indicate favorites.
- **Two-section layout:** Favorites appear above a divider. GitHub-native pins come first within each section; other favorites sort alphabetically, while workflows in the lower section keep GitHub's original order.
- **Current GitHub sidebar:** Supports the updated Actions navigation, with aligned multiline names, native hover styling, and rounded outer edges.
- **Workflow search:** Match names or filenames, ignoring case. The first search loads remaining workflow pages automatically, with progress, match counts, incomplete-result feedback, and retry.
- **Workflow-page support:** Personal pins work on `.yaml` and `.yml` workflow pages and are restored when GitHub replaces the sidebar during navigation.
- **Pagination support:** Keep pinned shortcuts visible even when their real rows are behind “Show more workflows.”
- **Input safeguards:** Preserve scroll position, typing focus, and selection during search loading; pause filtering and further pagination during IME composition.
- **Manual and automatic expansion:** Expand the list with the button beside “All workflows,” or enable Auto Unfold in the popup.
- **Chrome Sync:** Sync preferences across your devices when browser sync is enabled. This is not a strictly local-only storage mode.

## Install

### From a release — no build tools needed

1. Download `actions-wrangler-vX.Y.Z.zip` from the [latest release](https://github.com/dofy/actions-wrangler/releases/latest).
2. Extract it into a permanent directory. The selected directory must contain `manifest.json`.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Click **Load unpacked** and select the extracted directory.
5. Disable any other edition of Actions Wrangler, then refresh your GitHub tabs.

Keep the extracted directory: Chrome loads the extension from those files. Release assets include `SHA256SUMS.txt` for checksum verification.

### From source

Requires Node.js 18+, npm, and `rsvg-convert` for icon generation. On macOS, install the icon tool with `brew install librsvg`.

```bash
git clone https://github.com/dofy/actions-wrangler.git
cd actions-wrangler
npm ci
npm run build
```

Load the generated `dist` directory through **Load unpacked** in `chrome://extensions`.

### Update an existing unpacked installation

For release installations, replace the files in the same directory with the new ZIP contents. For source installations, update your checkout and rebuild:

```bash
git pull --ff-only
npm ci
npm run build
```

Then click **Reload** on the extension card and refresh your GitHub tabs. Keep the same installation directory to preserve the unpacked extension's identity and saved preferences.

The Web Store edition and this unpacked fork have separate storage. Personal pins are not automatically migrated between them.

## Usage

### Personal pins

Open a repository's Actions page and click the gray **star** before a workflow name. A filled star indicates a personal favorite; an outline indicates an unsaved workflow. GitHub's **pin icon** on the right retains its native behavior.

The list has two sections separated by a line:

- **Favorites at the top:** Workflows saved with the extension star. GitHub-native pins come first, followed by the remaining favorites sorted alphabetically by name.
- **Other workflows below:** Workflows without an extension star. GitHub-native pins come first, and the remaining workflows retain GitHub's original order.

Saving or removing a favorite moves it to the corresponding section immediately. The divider disappears when only one section has visible results, including during search.

### Search

Type into **Search workflows…** below “All workflows.” Search matches both display names and workflow filenames, such as `admin`, `auth-service`, or `.yaml`.

- The first search expands the remaining pages. Until loading completes, counts may describe only the loaded subset.
- If loading cannot finish, use **Retry loading** or GitHub's “Show more workflows” control.
- Click **Esc** at the right of the search field or press **Escape** to clear the query and show the list again; personal pins remain saved. The button is hidden when the field is empty, and clearing keeps focus in the search field.
- The query is kept during sidebar replacement within a repository and resets when changing repositories. It is not saved across page reloads.
- During IME composition, filtering and additional expansion wait until text is committed. Escape used by the input method does not clear the search.

### Popup settings

- **Auto Unfold:** Automatically expand workflows when the extension initializes on an Actions page.
- **Reset All Pinned Workflows:** Clear this extension's saved personal pins across repositories.

## Development and validation

```bash
npm run typecheck                   # TypeScript checks
npm run build                       # Bundle scripts, generate icons, copy static files
node --test tests/url-matching.cjs   # URL patterns and background-script checks
npm run watch                       # Rebuild scripts on changes
npm run package                     # Build and create actions-wrangler.zip
```

Browser regression scripts cover the updated sidebar, section sorting, navigation, pinning, search, pagination, scrolling, focus, and IME events. See [tests/README.md](tests/README.md) for commands and scope.

These tests use GitHub-shaped fixtures and mocked Chrome APIs. Native OS IME candidate windows have not been tested end-to-end. Already in-flight GitHub responses can still run during composition, and GitHub UI changes may require selector updates.

## Permissions and privacy

- **storage:** Store personal pins and settings using Chrome Sync.
- **tabs:** Update the extension icon for the current page.
- **Content scripts:** Enhance repository Actions pages on `github.com`.

No GitHub token is required. Automatic expansion activates GitHub's existing “Show more workflows” control using your current browser session. See [PRIVACY.md](PRIVACY.md) for the upstream privacy policy.

## Upstream contributions

- [PR #1: Workflow-page pinning and Turbo navigation](https://github.com/kldavis4/actions-wrangler/pull/1)
- [PR #2: Personal workflow search and input safeguards](https://github.com/kldavis4/actions-wrangler/pull/2)

This fork's releases can include changes before upstream merges or publishes them. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE). Original project by Kelly Davis; this fork retains the upstream license and attribution.
