# Workflow Harbor Privacy Policy

Last updated: November 4, 2026

Workflow Harbor is maintained by Seven Yu. It helps users search and organize GitHub Actions workflows. This policy applies to the Workflow Harbor browser extension.

## Information used

The extension checks open tab URLs locally to determine whether each tab is a GitHub Actions page and display the appropriate toolbar icon. It does not record a browsing history or send those tab URLs to the developer. When you visit GitHub, a lightweight listener detects navigation into Actions pages. On Actions pages it reads the repository identifier, workflow names, workflow URLs, and the page elements needed to display favorites, search, and loading controls. Search queries are used in the current page and are not saved across page reloads.

When you choose a favorite, the extension stores its repository, name, URL, and identifier, along with your extension settings, using Chrome's `storage.sync` API. Google may synchronize this data to your signed-in Chrome profile according to your Chrome sync settings and Google's policies. Your workflow choices and settings stay stored until you remove them or clear the extension's stored data. Use the popup's “Reset All Pinned Workflows” button to remove this extension's saved favorites across repositories.

## Sharing and network requests

The extension does not send your workflow choices, page content, search queries, or browsing history to the developer or an analytics service. When expanding a workflow list, it activates GitHub's existing pagination controls; the resulting requests are made to GitHub in your browser session. GitHub and Google handle data under their own policies.

## Permissions

- **github.com site access:** Detect navigation into Actions and read and modify Actions page elements to provide the features described above.
- **storage:** Save favorites and settings using Chrome storage and synchronization.
- **tabs:** Read tab URLs to select the active or inactive toolbar icon.

Workflow Harbor's use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Contact and changes

Questions or requests: open an issue at https://github.com/dofy/actions-wrangler/issues. Policy changes will be posted in this file with an updated date.
