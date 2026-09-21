import { setupSearch, refreshSearch } from './search';

// Actions Wrangler - Tame your GitHub Actions
// Pin unlimited workflows and quick-access your favorites

interface PinnedWorkflow {
  id: string;
  name: string;
  href: string;
}

const FILLED_STAR = 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z';
const OUTLINE_STAR = 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z';

const UNFOLD_ICON = `
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon Button-visual">
    <rect fill="currentColor" x="1" y="2" width="14" height="2" rx="1"/>
    <rect fill="currentColor" x="2" y="5.5" width="7" height="1.5" rx="0.5"/>
    <rect fill="currentColor" x="2" y="8" width="7" height="1.5" rx="0.5"/>
    <rect fill="currentColor" x="2" y="10.5" width="7" height="1.5" rx="0.5"/>
    <rect fill="currentColor" x="12" y="5" width="2" height="5"/>
    <path fill="currentColor" d="M10 10h6l-3 4z"/>
  </svg>
`;

// Initialize
(function() {
  initThemeDetection();
  init();
})();

function initThemeDetection(): void {
  // Detect and report initial theme
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  reportTheme(darkModeQuery.matches);

  // Listen for theme changes
  darkModeQuery.addEventListener('change', (e) => {
    reportTheme(e.matches);
  });
}

function reportTheme(isDark: boolean): void {
  chrome.runtime.sendMessage({ type: 'themeChange', isDark }).catch(() => {
    // Extension context may be invalid - ignore
  });
}

function init(): void {
  renderPinnedPlaceholders();
  addUnfoldButton();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debouncedSetup = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!/^\/[^/]+\/[^/]+\/actions(?:\/|$)/.test(location.pathname)) return;
      renderPinnedPlaceholders();
      addUnfoldButton();
      setupPinning();
    }, 50);
  };

  const observer = new MutationObserver((mutations) => {
    const hasNewItems = mutations.some(m =>
      Array.from(m.addedNodes).some(n =>
        n.nodeType === 1 && (
          (n as Element).matches?.('li.actions-workflow-list-item:not([data-unfold-placeholder])') ||
          (n as Element).querySelector?.('li.actions-workflow-list-item:not([data-unfold-placeholder])')
        )
      )
    );
    if (hasNewItems) {
      debouncedSetup();
    }
  });

  // Turbo navigation replaces the sidebar itself, so observe a stable ancestor.
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('turbo:load', debouncedSetup);
  document.addEventListener('turbo:frame-load', debouncedSetup);

  setTimeout(setupPinning, 100);

  chrome.storage.sync.get(['autoUnfold'], (result) => {
    if (result.autoUnfold === true) {
      runExpander(() => {
        setupPinning();
      });
    }
  });
}

function addUnfoldButton(): void {
  if (document.querySelector('.actions-unfold-trigger')) return;

  const waitForAllWorkflows = (attempts = 0): void => {
    const allWorkflowsLink = document.querySelector('a.ActionListContent[href$="/actions"]');

    if (!allWorkflowsLink && attempts < 50) {
      setTimeout(() => waitForAllWorkflows(attempts + 1), 100);
      return;
    }

    if (!allWorkflowsLink) return;

    setupSearch(runExpander);
    const li = allWorkflowsLink.closest('li');
    if (!li || li.querySelector('.actions-unfold-trigger')) return;

    li.classList.add('ActionListItem--withActions');

    const unfoldBtn = document.createElement('button');
    unfoldBtn.type = 'button';
    unfoldBtn.className = 'Button Button--iconOnly Button--invisible Button--medium actions-unfold-trigger color-bg-transparent';
    unfoldBtn.setAttribute('aria-label', 'Unfold all workflows');
    unfoldBtn.title = 'Unfold all workflows';
    unfoldBtn.innerHTML = UNFOLD_ICON;

    unfoldBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      unfoldBtn.disabled = true;
      unfoldBtn.style.opacity = '0.5';
      runExpander(() => {
        setupPinning();
        unfoldBtn.disabled = false;
        unfoldBtn.style.opacity = '';
      });
    });

    li.appendChild(unfoldBtn);
  };

  waitForAllWorkflows();
}

function getRepoKey(): string | null {
  const match = window.location.pathname.match(/^\/([^/]+\/[^/]+)/);
  return match ? match[1] : null;
}

function getPinnedKey(): string | null {
  const repo = getRepoKey();
  return repo ? `pinned:${repo}` : null;
}

async function loadPinned(): Promise<PinnedWorkflow[]> {
  const key = getPinnedKey();
  if (!key) return [];

  return new Promise(resolve => {
    chrome.storage.sync.get([key], (result) => {
      const data = result[key] || [];
      // Handle migration from old format (array of IDs)
      if (data.length > 0 && typeof data[0] === 'string') {
        resolve([]);
      } else {
        resolve(data as PinnedWorkflow[]);
      }
    });
  });
}

async function savePinned(pinned: PinnedWorkflow[]): Promise<void> {
  const key = getPinnedKey();
  if (!key) return;

  return new Promise(resolve => {
    chrome.storage.sync.set({ [key]: pinned }, resolve);
  });
}

async function renderPinnedPlaceholders(): Promise<void> {
  const pinned = await loadPinned();
  if (pinned.length === 0) return;

  const waitForList = (attempts = 0): void => {
    const workflowList = document.querySelector('ul.ActionListWrap:has(li.actions-workflow-list-item)') ||
                        document.querySelector('li.actions-workflow-list-item')?.closest('ul');

    if (!workflowList && attempts < 100) {
      setTimeout(() => waitForList(attempts + 1), 50);
      return;
    }

    if (!workflowList) return;

    const githubPinnedItems = workflowList.querySelectorAll('li.actions-workflow-list-item:has(.actions-unpin-button)');
    const insertAfter = githubPinnedItems.length > 0
      ? githubPinnedItems[githubPinnedItems.length - 1]
      : null;

    let lastInserted: Element | null = insertAfter;
    pinned.forEach(workflow => {
      const existing = Array.from(workflowList.querySelectorAll('li.actions-workflow-list-item'))
        .find(item => item.getAttribute('data-item-id') === workflow.id);
      if (existing) {
        lastInserted = existing;
        return;
      }
      const placeholder = createPlaceholderItem(workflow);
      if (lastInserted) {
        lastInserted.after(placeholder);
      } else {
        workflowList.prepend(placeholder);
      }
      lastInserted = placeholder;
    });
    refreshSearch();
  };

  waitForList();
}

function createPlaceholderItem(workflow: PinnedWorkflow): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'actions-workflow-list-item ActionListItem ActionListItem--withActions actions-unfold-placeholder';
  li.setAttribute('data-item-id', workflow.id);
  li.setAttribute('data-unfold-placeholder', 'true');

  li.innerHTML = `
    <a href="${workflow.href}" data-view-component="true" class="ActionListContent" data-turbo-frame="repo-content-turbo-frame">
      <span data-view-component="true" class="ActionListItem-label ActionListItem-label--truncate">
        ${escapeHtml(workflow.name)}
      </span>
    </a>
  `;

  const pinButton = createPinButton(workflow.id, workflow.name, true);
  pinButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await togglePinFromPlaceholder(workflow.id, li);
  });
  li.appendChild(pinButton);

  return li;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createPinButton(workflowId: string, workflowName: string, isPinned: boolean): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'Button Button--iconOnly Button--invisible Button--medium actions-unfold-pin color-bg-transparent';
  button.setAttribute('aria-label', isPinned ? `Unpin ${workflowName} (extension)` : `Pin ${workflowName} (extension)`);
  button.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
  button.setAttribute('data-workflow-id', workflowId);
  button.style.cssText = isPinned ? '' : 'opacity: 0.5;';

  button.innerHTML = `
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-star Button-visual" style="fill: ${isPinned ? '#f0883e' : 'currentColor'};">
      <path d="${isPinned ? FILLED_STAR : OUTLINE_STAR}"/>
    </svg>
  `;

  return button;
}

async function togglePinFromPlaceholder(workflowId: string, placeholderItem: HTMLLIElement): Promise<void> {
  const pinned = await loadPinned();
  const index = pinned.findIndex(p => p.id === workflowId);

  if (index !== -1) {
    pinned.splice(index, 1);
    await savePinned(pinned);
    placeholderItem.remove();
    refreshSearch();
  }
}

async function setupPinning(): Promise<void> {
  const pinned = await loadPinned();
  const pinnedIds = pinned.map(p => p.id);
  const workflowItems = document.querySelectorAll('li.actions-workflow-list-item:not([data-unfold-placeholder])');

  if (workflowItems.length === 0) return;

  const list = workflowItems[0].parentElement;
  if (!list) return;

  workflowItems.forEach(item => {
    const workflowId = item.getAttribute('data-item-id');
    const link = item.querySelector('a.ActionListContent');
    const workflowName = link?.textContent?.trim() || 'workflow';
    const workflowHref = link?.getAttribute('href') || '';

    if (!workflowId) return;
    if (item.querySelector('.actions-unfold-pin')) return;

    const isPinned = pinnedIds.includes(workflowId);
    const pinButton = createPinButton(workflowId, workflowName, isPinned);

    pinButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await togglePin(workflowId, workflowName, workflowHref, pinButton, item as HTMLElement, list as HTMLElement);
    });

    item.appendChild(pinButton);

    if (isPinned) {
      // Only remove the placeholder whose real row has loaded. Other pins may
      // still be hidden behind GitHub's "Show more workflows" pagination.
      list.querySelectorAll('.actions-unfold-placeholder').forEach(placeholder => {
        if (placeholder.getAttribute('data-item-id') === workflowId) placeholder.remove();
      });
    }
  });

  const githubPinnedItems = Array.from(list.querySelectorAll('li.actions-workflow-list-item'))
    .filter(item => item.querySelector('.actions-unpin-button'));
  let insertAfter: Element | null = githubPinnedItems[githubPinnedItems.length - 1] || null;
  pinnedIds.forEach(id => {
    const item = Array.from(list.children).find(row => row.getAttribute('data-item-id') === id);
    if (!item || item.querySelector('.actions-unpin-button')) return;
    const next = insertAfter ? insertAfter.nextElementSibling : list.firstElementChild;
    if (next !== item) {
      if (insertAfter) insertAfter.after(item);
      else list.prepend(item);
    }
    insertAfter = item;
  });
  refreshSearch();
}

async function togglePin(
  workflowId: string,
  workflowName: string,
  workflowHref: string,
  button: HTMLButtonElement,
  item: HTMLElement,
  list: HTMLElement
): Promise<void> {
  const pinned = await loadPinned();
  const index = pinned.findIndex(p => p.id === workflowId);
  const isPinned = index !== -1;

  const svg = button.querySelector('svg');
  const path = button.querySelector('path');

  if (isPinned) {
    pinned.splice(index, 1);
    button.setAttribute('aria-label', `Pin ${workflowName} (extension)`);
    button.setAttribute('aria-pressed', 'false');
    button.style.opacity = '0.5';
    if (svg) svg.style.fill = 'currentColor';
    if (path) path.setAttribute('d', OUTLINE_STAR);
  } else {
    pinned.push({
      id: workflowId,
      name: workflowName,
      href: workflowHref
    });
    button.setAttribute('aria-label', `Unpin ${workflowName} (extension)`);
    button.setAttribute('aria-pressed', 'true');
    button.style.opacity = '';
    if (svg) svg.style.fill = '#f0883e';
    if (path) path.setAttribute('d', FILLED_STAR);

    const githubPinnedItems = Array.from(list.querySelectorAll('li.actions-workflow-list-item'))
      .filter(li => li.querySelector('.actions-unpin-button'));
    const insertAfter = githubPinnedItems[githubPinnedItems.length - 1];

    if (insertAfter) {
      insertAfter.after(item);
    } else {
      list.prepend(item);
    }
  }

  await savePinned(pinned);
}

// Share expansion between search, manual unfold, and auto-unfold.
let expansion: { pane: Element; callbacks: Array<(complete: boolean) => void> } | null = null;

function runExpander(onComplete?: (complete: boolean) => void): void {
  const pane = document.querySelector('[data-target="split-page-layout.pane"]');
  if (!pane) { onComplete?.(false); return; }
  if (expansion?.pane === pane) {
    if (onComplete) expansion.callbacks.push(onComplete);
    return;
  }
  const current = { pane, callbacks: onComplete ? [onComplete] : [] };
  expansion = current;
  const path = location.pathname;
  const deadline = Date.now() + 30000;
  let absentChecks = 0;
  let clicked: HTMLButtonElement | undefined;
  let rowsAtClick = 0;
  const finish = (complete: boolean): void => {
    if (expansion === current) expansion = null;
    current.callbacks.forEach(callback => callback(complete));
  };
  const poll = (): void => {
    if (!pane.isConnected || location.pathname !== path || expansion !== current) {
      finish(false);
      return;
    }
    const rows = pane.querySelectorAll('li.actions-workflow-list-item:not([data-unfold-placeholder])').length;
    const button = Array.from(pane.querySelectorAll<HTMLButtonElement>('button.ActionListContent'))
      .find(el => el.textContent?.includes('Show more workflows'));
    if (Date.now() >= deadline) { finish(false); return; }
    if (button) {
      absentChecks = 0;
      // Wait for the previous request to add rows instead of clicking repeatedly.
      if (!button.disabled && (button !== clicked || rows !== rowsAtClick)) {
        clicked = button;
        rowsAtClick = rows;
        button.click();
      }
    } else if (clicked && rows === rowsAtClick) {
      // A pending request may temporarily remove or relabel the load button.
      absentChecks = 0;
    } else if (++absentChecks >= 3) {
      setupPinning();
      finish(true);
      return;
    }
    setTimeout(poll, 500);
  };
  poll();
}
