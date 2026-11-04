// Prefer semantic navigation landmarks; GitHub's React and legacy sidebars coexist.
export const WORKFLOW_LINK = 'a[href*="/actions/workflows/"]';
export const SIDEBAR_ITEM = 'li, [data-component="Sidebar.Item"]';
export const WORKFLOW_ROW = `:is(${SIDEBAR_ITEM}):has(${WORKFLOW_LINK}):not(:has(:is(${SIDEBAR_ITEM}) ${WORKFLOW_LINK}))`;
export const WORKFLOW_ACTION = ':is([data-component="ActionList.TrailingAction"], [data-component="Sidebar.Action"]):not(.actions-wrangler-action)';

export function getPane(): Element | null {
  return document.querySelector('aside[aria-label="Actions"] nav[aria-label="Workflows"]')
    || document.querySelector('[aria-label="Actions workflows" i]')
    || document.querySelector('[data-target="split-page-layout.pane"]');
}

export function getAllWorkflows(): HTMLAnchorElement | null {
  const pane = getPane();
  if (!pane) return null;
  const path = location.pathname.match(/^\/[^/]+\/[^/]+\/actions/)?.[0];
  return Array.from(pane.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find(link => link.pathname.replace(/\/$/, '') === path)
    || pane.querySelector<HTMLAnchorElement>('a.ActionListContent[href$="/actions"]');
}

export function getWorkflowList(): Element | null {
  return getPane()?.querySelector(WORKFLOW_LINK)?.closest(SIDEBAR_ITEM)?.parentElement || null;
}

export function isNativePinned(row: Element): boolean {
  if (row.querySelector('.actions-unpin-button, [aria-label="pinned"]')) return true;
  return Array.from(row.querySelectorAll<HTMLButtonElement>('button:not(.actions-unfold-pin)')).some(button => {
    const label = button.getAttribute('aria-label') || (button.getAttribute('aria-labelledby') || '')
      .split(/\s+/).map(id => button.ownerDocument.getElementById(id)?.textContent || '').join(' ');
    return label.trim().startsWith('Unpin ');
  });
}

export function workflowId(row: Element): string | null {
  // Keep legacy numeric IDs when available; saved pins are also matched by href.
  return row.getAttribute('data-wrangler-id') || row.getAttribute('data-item-id') || row.querySelector<HTMLAnchorElement>(WORKFLOW_LINK)?.pathname.split('/').pop() || null;
}
