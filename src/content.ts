import { t } from './i18n';
import { SIDEBAR_ITEM, WORKFLOW_ACTION, WORKFLOW_LINK, WORKFLOW_ROW, getPane, getAllWorkflows, getWorkflowList, isNativePinned, workflowId as getWorkflowId } from './sidebar';
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
  <svg aria-hidden="true" focusable="false" height="16" viewBox="0 0 16 16" width="16" class="octicon Button-visual" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2v8m-3-3 3 3 3-3M3.5 13.5h9"/>
  </svg>
`;

// Initialize
(function() {
  let initialized = false;
  const navigationEvents = ['turbo:load', 'turbo:render', 'turbo:frame-load'];
  // GitHub can enter Actions without a document load. Keep only a lightweight
  // bootstrap on other pages, then hand navigation to the existing observer.
  const observer = new MutationObserver(() => maybeInitialize());
  const maybeInitialize = (): void => {
    if (initialized || !/^\/[^/]+\/[^/]+\/actions(?:\/|$)/.test(location.pathname)) return;
    initialized = true;
    observer.disconnect();
    navigationEvents.forEach(event => document.removeEventListener(event, maybeInitialize));
    initThemeDetection();
    init();
  };
  observer.observe(document.documentElement, { childList: true, subtree: true });
  navigationEvents.forEach(event => document.addEventListener(event, maybeInitialize));
  maybeInitialize();
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
  const buttonStyles = document.createElement('style');
  buttonStyles.textContent = `
    :is(li, [data-component="Sidebar.Item"]):has(> .actions-unfold-trigger) { display: flex; }
    :is(li, [data-component="Sidebar.Item"]):has(> .actions-unfold-trigger) > a {
      flex: 1; min-width: 0; order: 0;
      border-top-right-radius: 0; border-bottom-right-radius: 0;
    }
    .actions-unfold-trigger {
      order: 1; flex: 0 0 32px; width: 32px; margin-left: auto;
      display: inline-flex; align-items: center; justify-content: center; align-self: stretch;
      padding: 0; border: 0; border-radius: 0 var(--borderRadius-medium, 6px) var(--borderRadius-medium, 6px) 0;
      background: transparent; color: var(--fgColor-muted, #656d76); cursor: pointer;
    }
    .actions-unfold-trigger:hover:not(:disabled) { background: var(--control-transparent-bgColor-hover, rgba(129, 139, 152, .1)); }
    .actions-unfold-trigger:focus-visible { outline: 2px solid var(--focus-outlineColor, #0969da); outline-offset: -2px; }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > .actions-wrangler-action {
      display: flex; align-self: stretch;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > .actions-wrangler-action > button {
      height: auto; min-height: 32px; align-self: stretch;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > [data-component="Sidebar.Action"] {
      flex: 0 0 32px; width: 32px;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) {
      position: relative;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > a[aria-current="page"]::before {
      display: none;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action):has(> a[aria-current="page"])::before {
      content: ""; position: absolute; left: -8px; top: 4px; bottom: 4px; width: 4px;
      border-radius: var(--borderRadius-medium, 6px);
      background: var(--borderColor-accent-emphasis, #0969da); pointer-events: none;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > [data-component="Sidebar.Action"] > span {
      flex: 1; width: 100%;
    }
    [data-component="Sidebar.Item"]:has(> .actions-wrangler-action) > [data-component="Sidebar.Action"] button {
      width: 100%; min-width: 0;
      border-radius: 0 var(--borderRadius-medium, 6px) var(--borderRadius-medium, 6px) 0;
    }
    aside[aria-label="Actions"][data-expanded="false"] :is(.actions-workflow-search, .actions-unfold-trigger, .actions-wrangler-action, .actions-unfold-placeholder, .actions-wrangler-divider) {
      display: none !important;
    }
    .actions-wrangler-action { flex-shrink: 0; opacity: .4; }
    :is(.actions-wrangler-row, [data-wrangler-id]):hover > .actions-wrangler-action,
    .actions-wrangler-action:focus-within { opacity: 1; }
  `;
  document.head.appendChild(buttonStyles);
  let autoUnfold = false;
  const expandedPanes = new WeakSet<Element>();
  const maybeAutoUnfold = (): void => {
    const pane = getPane();
    if (!autoUnfold || !pane || expandedPanes.has(pane)) return;
    expandedPanes.add(pane);
    runExpander(() => { setupPinning(); });
  };
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
      maybeAutoUnfold();
    }, 50);
  };

  const observer = new MutationObserver((mutations) => {
    const hasNewItems = mutations.some(m =>
      Array.from(m.addedNodes).some(n =>
        n.nodeType === 1 && (
          (n as Element).matches?.(`${WORKFLOW_ROW}:not([data-unfold-placeholder])`) ||
          (n as Element).querySelector?.(`${WORKFLOW_ROW}:not([data-unfold-placeholder])`)
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
    autoUnfold = result.autoUnfold === true;
    maybeAutoUnfold();
  });
}

function addUnfoldButton(): void {
  if (document.querySelector('.actions-unfold-trigger')) return;

  const waitForAllWorkflows = (attempts = 0): void => {
    const allWorkflowsLink = getAllWorkflows();

    if (!allWorkflowsLink && attempts < 50) {
      setTimeout(() => waitForAllWorkflows(attempts + 1), 100);
      return;
    }

    if (!allWorkflowsLink) return;

    setupSearch(runExpander);
    const li = allWorkflowsLink.closest(SIDEBAR_ITEM);
    if (!li || li.querySelector('.actions-unfold-trigger')) return;

    li.classList.add('ActionListItem--withActions');
    (li as HTMLElement).style.display = 'flex';

    const unfoldBtn = document.createElement('button');
    unfoldBtn.type = 'button';
    unfoldBtn.className = 'Button Button--iconOnly Button--invisible Button--medium actions-unfold-trigger';
    allWorkflowsLink.style.flex = '1';
    unfoldBtn.setAttribute('aria-label', t('unfold'));
    unfoldBtn.title = t('unfold');
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
    const workflowList = getWorkflowList();

    if (!workflowList && attempts < 100) {
      setTimeout(() => waitForList(attempts + 1), 50);
      return;
    }

    if (!workflowList) return;

    const githubPinnedItems = Array.from(workflowList.querySelectorAll(WORKFLOW_ROW)).filter(isNativePinned);
    const insertAfter = githubPinnedItems.length > 0
      ? githubPinnedItems[githubPinnedItems.length - 1]
      : null;

    let lastInserted: Element | null = insertAfter;
    pinned.forEach(workflow => {
      const existing = Array.from(workflowList.querySelectorAll(WORKFLOW_ROW))
        .find(item => getWorkflowId(item) === workflow.id || item.querySelector<HTMLAnchorElement>(WORKFLOW_LINK)?.pathname === new URL(workflow.href, location.origin).pathname);
      if (existing) {
        lastInserted = existing;
        return;
      }
      const placeholder = createPlaceholderItem(workflow, workflowList);
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

function createPlaceholderItem(workflow: PinnedWorkflow, list: Element): HTMLElement {
  const li = document.createElement(list.matches('ul, ol') ? 'li' : 'div');
  li.className = 'actions-workflow-list-item ActionListItem ActionListItem--withActions actions-unfold-placeholder';
  li.setAttribute('data-item-id', workflow.id);
  li.setAttribute('data-unfold-placeholder', 'true');
  li.classList.add('actions-wrangler-row');
  if (!list.matches('ul, ol')) li.setAttribute('data-component', 'Sidebar.Item');
  li.style.cssText = 'display:flex;align-items:center;min-width:0;';

  li.innerHTML = `
    <a href="${workflow.href}" data-view-component="true" class="ActionListContent" data-turbo-frame="repo-content-turbo-frame">
      <span data-view-component="true" class="ActionListItem-label ActionListItem-label--truncate">
        ${escapeHtml(workflow.name)}
      </span>
    </a>
  `;

  const link = li.querySelector<HTMLElement>('a');
  if (link) link.style.cssText = 'flex:1;min-width:0;padding:6px 8px;color:inherit;text-decoration:none;overflow:hidden;text-overflow:ellipsis;';
  const pinButton = createPinButton(workflow.id, workflow.name, true);
  pinButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await togglePinFromPlaceholder(workflow.id, li);
  });
  attachPinButton(li, pinButton);

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
  button.setAttribute('aria-label', isPinned ? t('unpin', workflowName) : t('pin', workflowName));
  button.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
  button.setAttribute('data-workflow-id', workflowId);
  const nativeButton = getPane()?.querySelector<HTMLButtonElement>(`${WORKFLOW_ACTION} button[data-component="IconButton"]`);
  if (nativeButton) {
    // Reuse Primer's actual component styles, including hover, active and focus.
    button.className = `${nativeButton.className} actions-unfold-pin`;
    for (const attribute of ['data-component', 'data-size', 'data-variant', 'data-no-visuals']) {
      const value = nativeButton.getAttribute(attribute);
      if (value !== null) button.setAttribute(attribute, value);
    }

  } else {
    button.style.cssText = 'flex-shrink:0;align-self:center;padding:6px;border:0;border-radius:6px;background:transparent;color:inherit;cursor:pointer;';
  }

  button.innerHTML = `
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-star Button-visual" style="fill: currentColor;">
      <path d="${isPinned ? FILLED_STAR : OUTLINE_STAR}"/>
    </svg>
  `;

  return button;
}

function attachPinButton(item: Element, button: HTMLButtonElement): void {
  const nativeAction = item.querySelector(WORKFLOW_ACTION);
  const template = nativeAction || getPane()?.querySelector(WORKFLOW_ACTION);
  const wrapper = document.createElement('span');
  wrapper.className = (template ? Array.from(template.classList).filter(name => name.startsWith('prc-')).join(' ') : '') + ' actions-wrangler-action';
  if (template?.getAttribute('data-component') === 'ActionList.TrailingAction') wrapper.setAttribute('data-component', 'ActionList.TrailingAction');
  wrapper.style.cssText = 'flex:0 0 32px;width:32px;';
  button.style.width = '100%';
  // The favorite owns the left edge; the native pin owns the right edge.
  button.style.borderRadius = 'var(--borderRadius-medium, 6px) 0 0 var(--borderRadius-medium, 6px)';
  wrapper.appendChild(button);
  item.prepend(wrapper);

  const link = item.querySelector<HTMLElement>(WORKFLOW_LINK);
  if (link) {
    link.style.minWidth = '0';
    link.style.borderTopLeftRadius = '0';
    link.style.borderBottomLeftRadius = '0';
    if (template) {
      link.style.borderTopRightRadius = '0';
      link.style.borderBottomRightRadius = '0';
    }
  }
  // Placeholder rows have no native action, but keep the same text column width.
  if (template && !nativeAction) (item as HTMLElement).style.paddingRight = '32px';
}

async function togglePinFromPlaceholder(workflowId: string, placeholderItem: HTMLElement): Promise<void> {
  const pinned = await loadPinned();
  const index = pinned.findIndex(p => p.id === workflowId);

  if (index !== -1) {
    pinned.splice(index, 1);
    await savePinned(pinned);
    const list = placeholderItem.parentElement;
    placeholderItem.remove();
    if (list) arrangeWorkflowSections(list);
    refreshSearch();
  }
}

async function setupPinning(): Promise<void> {
  const pinned = await loadPinned();
  const workflowItems = getPane()?.querySelectorAll(`${WORKFLOW_ROW}:not([data-unfold-placeholder])`);

  if (!workflowItems || workflowItems.length === 0) return;

  const list = workflowItems[0].parentElement;
  if (!list) return;

  workflowItems.forEach(item => {
    const workflowId = getWorkflowId(item);
    const link = item.querySelector(WORKFLOW_LINK);
    const workflowName = link?.textContent?.trim() || 'workflow';
    const workflowHref = link?.getAttribute('href') || '';

    if (!workflowId) return;
    if (item.querySelector('.actions-unfold-pin')) return;

    const saved = pinned.find(p => p.id === workflowId || new URL(p.href, location.origin).pathname === new URL(workflowHref, location.origin).pathname);
    item.setAttribute('data-wrangler-id', saved?.id || workflowId);
    const pinId = saved?.id || workflowId;
    const isPinned = !!saved;
    const pinButton = createPinButton(pinId, workflowName, isPinned);

    pinButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await togglePin(pinId, workflowName, workflowHref, pinButton, list as HTMLElement);
    });

    item.classList.add('actions-wrangler-row');
    (item as HTMLElement).style.display = 'flex';
    (link as HTMLElement | null)?.style.setProperty('flex', '1');
    attachPinButton(item, pinButton);

    if (isPinned) {
      // Only remove the placeholder whose real row has loaded. Other pins may
      // still be hidden behind GitHub's "Show more workflows" pagination.
      list.querySelectorAll('.actions-unfold-placeholder').forEach(placeholder => {
        if (placeholder.getAttribute('data-item-id') === pinId) placeholder.remove();
      });
    }
  });

  arrangeWorkflowSections(list);
  refreshSearch();
}

// Keep GitHub's loaded order separately so unpinning returns a row to its place.
const workflowOrder = new WeakMap<Element, number>();
const nextWorkflowOrder = new WeakMap<Element, number>();

function arrangeWorkflowSections(list: Element): void {
  const rows = Array.from(list.children).filter(row => row.matches(WORKFLOW_ROW));
  let nextOrder = nextWorkflowOrder.get(list) || 0;
  rows.forEach(row => {
    if (!workflowOrder.has(row)) workflowOrder.set(row, nextOrder++);
  });
  nextWorkflowOrder.set(list, nextOrder);
  const starred = (row: Element): boolean => row.querySelector('.actions-unfold-pin')?.getAttribute('aria-pressed') === 'true';
  const originalOrder = (a: Element, b: Element): number => workflowOrder.get(a)! - workflowOrder.get(b)!;
  const favorites = rows.filter(starred).sort((a, b) => {
    const nativeDifference = Number(isNativePinned(b)) - Number(isNativePinned(a));
    if (nativeDifference) return nativeDifference;
    if (isNativePinned(a)) return originalOrder(a, b);
    return (a.querySelector(WORKFLOW_LINK)?.textContent?.trim() || '').localeCompare(
      b.querySelector(WORKFLOW_LINK)?.textContent?.trim() || '', 'en', { sensitivity: 'base', numeric: true }
    ) || originalOrder(a, b);
  });
  const others = rows.filter(row => !starred(row)).sort((a, b) =>
    Number(isNativePinned(b)) - Number(isNativePinned(a)) || originalOrder(a, b)
  );
  rows.forEach(row => row.setAttribute('data-wrangler-section', starred(row) ? 'favorites' : 'others'));

  let divider = list.querySelector<HTMLElement>(':scope > .actions-wrangler-divider');
  if (!divider && favorites.length && others.length) {
    divider = document.createElement(list.matches('ul, ol') ? 'li' : 'div');
    divider.className = 'actions-wrangler-divider';
    divider.setAttribute('role', 'separator');
    divider.setAttribute('aria-label', t('others'));
    divider.style.cssText = 'list-style:none;height:1px;margin:8px;border-top:1px solid var(--borderColor-default, #d1d9e0);';
  }
  const ordered: Element[] = [...favorites, ...(divider ? [divider] : []), ...others];
  let anchor: ChildNode | null = rows[rows.length - 1]?.nextSibling || null;
  // Work backwards, moving only rows that are not already in the right place.
  for (const row of ordered.reverse()) {
    if (row.nextSibling !== anchor || row.parentElement !== list) list.insertBefore(row, anchor);
    anchor = row;
  }
}

async function togglePin(
  workflowId: string,
  workflowName: string,
  workflowHref: string,
  button: HTMLButtonElement,
  list: HTMLElement
): Promise<void> {
  const pinned = await loadPinned();
  const index = pinned.findIndex(p => p.id === workflowId);
  const isPinned = index !== -1;

  const svg = button.querySelector('svg');
  const path = button.querySelector('path');

  if (isPinned) {
    pinned.splice(index, 1);
    button.setAttribute('aria-label', t('pin', workflowName));
    button.setAttribute('aria-pressed', 'false');

    if (svg) svg.style.fill = 'currentColor';
    if (path) path.setAttribute('d', OUTLINE_STAR);
  } else {
    pinned.push({
      id: workflowId,
      name: workflowName,
      href: workflowHref
    });
    button.setAttribute('aria-label', t('unpin', workflowName));
    button.setAttribute('aria-pressed', 'true');

    if (svg) svg.style.fill = 'currentColor';
    if (path) path.setAttribute('d', FILLED_STAR);


  }

  await savePinned(pinned);
  arrangeWorkflowSections(list);
  refreshSearch();
}

// Share expansion between search, manual unfold, and auto-unfold.
let expansion: { pane: Element; callbacks: Array<(complete: boolean) => void> } | null = null;

function runExpander(onComplete?: (complete: boolean) => void): void {
  const pane = getPane();
  if (!pane) { onComplete?.(false); return; }
  if (expansion?.pane === pane) {
    if (onComplete) expansion.callbacks.push(onComplete);
    return;
  }
  const current = { pane, callbacks: onComplete ? [onComplete] : [] };
  expansion = current;
  const path = location.pathname;
  let deadline = Date.now() + 30000;
  let lastPoll = Date.now();
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
    const now = Date.now();
    const elapsed = now - lastPoll;
    lastPoll = now;
    // Do not activate GitHub controls while the user is choosing IME candidates.
    if (pane.querySelector('.actions-workflow-search input[data-composing="true"]')) {
      deadline += elapsed;
      setTimeout(poll, 500);
      return;
    }
    const rows = pane.querySelectorAll(`${WORKFLOW_ROW}:not([data-unfold-placeholder])`).length;
    const button = Array.from(pane.querySelectorAll<HTMLButtonElement>('button'))
      .find(el => /^Show more(?: workflows)?(?:\.\.\.|…)?$/.test(el.textContent?.trim() || ''));
    if (Date.now() >= deadline) { finish(false); return; }
    if (button) {
      absentChecks = 0;
      // Wait for the previous request to add rows instead of clicking repeatedly.
      if (!button.disabled && button.getAttribute('aria-disabled') !== 'true' && (button !== clicked || rows !== rowsAtClick)) {
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
