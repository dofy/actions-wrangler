// Actions Wrangler - Background service worker
// Handles icon switching based on current URL and system theme

const MATCH_PATTERNS = [
  /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/?$/,
  /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/workflows\/.*\.yml$/
];

let isDarkMode = false;

function isMatchingUrl(url: string): boolean {
  return MATCH_PATTERNS.some(pattern => pattern.test(url));
}

function getIconPath(isActive: boolean, darkMode: boolean): Record<string, string> {
  // isActive: on a GitHub Actions page
  // darkMode: browser/system is in dark mode
  let suffix = '';
  if (!isActive && darkMode) {
    suffix = '-grey-light';
  } else if (!isActive) {
    suffix = '-grey';
  } else if (darkMode) {
    suffix = '-light';
  }

  return {
    16: `icon16${suffix}.png`,
    48: `icon48${suffix}.png`,
    128: `icon128${suffix}.png`
  };
}

function updateIcon(tabId: number, url: string | undefined): void {
  const isActive = url && isMatchingUrl(url);

  chrome.action.setIcon({
    tabId,
    path: getIconPath(isActive, isDarkMode)
  }).catch(() => {
    // Tab may have been closed - ignore
  });
}

async function updateAllTabIcons(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        updateIcon(tab.id, tab.url);
      }
    }
  } catch {
    // Ignore errors
  }
}

// Listen for theme changes from content script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'themeChange') {
    const newDarkMode = message.isDark;
    if (newDarkMode !== isDarkMode) {
      isDarkMode = newDarkMode;
      // Update all tab icons when theme changes
      updateAllTabIcons();
    }
  }
});

// Update icon when tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateIcon(tab.id!, tab.url);
  } catch {
    // Tab may have been closed - ignore
  }
});

// Update icon when tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateIcon(tabId, tab.url);
  }
});
