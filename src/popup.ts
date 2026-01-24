// Actions Wrangler - Popup script

const autoUnfoldToggle = document.getElementById('autoUnfold') as HTMLInputElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

// Detect and report theme to background
function reportTheme(isDark: boolean): void {
  chrome.runtime.sendMessage({ type: 'themeChange', isDark }).catch(() => {
    // Ignore errors
  });
}

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
reportTheme(darkModeQuery.matches);
darkModeQuery.addEventListener('change', (e) => reportTheme(e.matches));

// Load current state
chrome.storage.sync.get(['autoUnfold'], (result) => {
  autoUnfoldToggle.checked = result.autoUnfold === true;
});

// Save state on toggle
autoUnfoldToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ autoUnfold: autoUnfoldToggle.checked });
});

// Reset all pinned workflows
resetBtn.addEventListener('click', () => {
  if (!confirm('This will clear all extension-pinned workflows across all repositories. Continue?')) {
    return;
  }

  resetBtn.disabled = true;
  resetBtn.textContent = 'Resetting...';

  chrome.storage.sync.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(key => key.startsWith('pinned:'));

    if (keysToRemove.length === 0) {
      statusEl.textContent = 'No pinned workflows to clear';
      resetBtn.disabled = false;
      resetBtn.textContent = 'Reset All Pinned Workflows';
      return;
    }

    chrome.storage.sync.remove(keysToRemove, () => {
      statusEl.textContent = `Cleared ${keysToRemove.length} repo(s)`;
      resetBtn.disabled = false;
      resetBtn.textContent = 'Reset All Pinned Workflows';
    });
  });
});

// Changelog toggle
const changelogToggle = document.getElementById('changelogToggle');
const changelogContent = document.getElementById('changelogContent');
const changelogArrow = document.getElementById('changelogArrow');

changelogToggle?.addEventListener('click', () => {
  changelogContent?.classList.toggle('expanded');
  changelogArrow?.classList.toggle('expanded');
});
