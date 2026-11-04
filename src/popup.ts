import { t } from './i18n';

document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
  el.textContent = t(el.dataset.i18n as Parameters<typeof t>[0]);
});
document.documentElement.lang = /^zh/i.test(chrome.i18n?.getUILanguage?.() || '') ? 'zh-CN' : 'en';

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
  autoUnfoldToggle.setAttribute('aria-label', t('auto'));
});

// Save state on toggle
autoUnfoldToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ autoUnfold: autoUnfoldToggle.checked });
});

// Reset all pinned workflows
resetBtn.addEventListener('click', () => {
  if (!confirm(t('resetConfirm'))) {
    return;
  }

  resetBtn.disabled = true;
  resetBtn.textContent = t('resetting');

  chrome.storage.sync.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(key => key.startsWith('pinned:'));

    if (keysToRemove.length === 0) {
      statusEl.textContent = t('noPins');
      resetBtn.disabled = false;
      resetBtn.textContent = t('reset');
      return;
    }

    chrome.storage.sync.remove(keysToRemove, () => {
      statusEl.textContent = t('cleared', keysToRemove.length);
      resetBtn.disabled = false;
      resetBtn.textContent = t('reset');
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
