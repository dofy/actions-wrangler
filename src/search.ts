import { WORKFLOW_LINK, WORKFLOW_ROW, getPane, getAllWorkflows } from './sidebar';
type Expand = (done: (complete: boolean) => void) => void;
let query = '';
let repository = '';

// State belongs to the rendered sidebar; a Turbo replacement gets a fresh load.
export function setupSearch(expand: Expand): void {
  const repo = location.pathname.split('/').slice(1, 3).join('/');
  if (repo !== repository) { repository = repo; query = ''; }
  const all = getAllWorkflows()?.closest('li');
  if (!all || document.querySelector('.actions-workflow-search')) return;
  const wrapper = document.createElement('li');
  wrapper.className = 'actions-workflow-search';
  wrapper.style.cssText = 'list-style:none;padding:8px;';
  const field = document.createElement('div');
  field.style.position = 'relative';
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'form-control';
  input.placeholder = 'Search workflows…';
  input.setAttribute('aria-label', 'Search workflows by name or filename');
  input.style.width = '100%';
  input.value = query;
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'actions-workflow-search-clear';
  clear.textContent = 'Esc';
  clear.setAttribute('aria-label', 'Clear workflow search');
  clear.title = 'Clear search (Esc)';
  const styles = document.createElement('style');
  styles.textContent = `
    .actions-workflow-search input::-webkit-search-cancel-button { display: none; }
    .actions-workflow-search-clear[hidden] { display: none; }
    .actions-workflow-search-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      padding: 0 5px; height: 22px; border: 1px solid var(--borderColor-default, #d1d9e0);
      border-radius: 4px; background: var(--bgColor-muted, #f6f8fa);
      color: var(--fgColor-muted, #656d76); font: inherit; font-size: 11px; cursor: pointer;
    }
    .actions-workflow-search-clear:hover:not(:disabled) {
      background: var(--control-transparent-bgColor-hover, rgba(129, 139, 152, .1));
      color: var(--fgColor-default, #1f2328);
    }
    .actions-workflow-search-clear:disabled { opacity: .5; cursor: default; }
    .actions-workflow-search-clear:focus-visible { outline: 2px solid var(--focus-outlineColor, #0969da); outline-offset: 1px; }
  `;
  field.append(input, clear);
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'font-size:12px;color:var(--fgColor-muted, #656d76);margin-top:4px;';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn btn-sm';
  retry.textContent = 'Retry loading';
  retry.hidden = true;
  wrapper.append(styles, field, status, retry);
  all.after(wrapper);
  let composing = false;
  let loading = false;
  let attempted = false;
  let complete = false;
  let timer: ReturnType<typeof setTimeout>;

  const filter = (): void => {
    clear.hidden = !input.value;
    input.style.paddingRight = clear.hidden ? '' : '56px';
    clear.disabled = composing || !input.value;
    if (composing) return;
    const term = input.value.trim().toLocaleLowerCase();
    let count = 0;
    const pane = getPane();
    pane?.querySelectorAll<HTMLElement>(WORKFLOW_ROW).forEach(row => {
      const link = row.querySelector<HTMLAnchorElement>(WORKFLOW_LINK);
      let filename = link?.pathname.split('/').pop() || '';
      try { filename = decodeURIComponent(filename); } catch { /* Keep malformed names searchable. */ }
      const match = !term || `${link?.textContent || ''} ${filename}`.toLocaleLowerCase().includes(term);
      row.hidden = !match;
      // GitHub's list styles can override the UA hidden rule.
      if (match) {
        if (row.classList.contains('actions-wrangler-row')) row.style.display = 'flex';
        else row.style.removeProperty('display');
      }
      else row.style.setProperty('display', 'none', 'important');
      if (match) count++;
    });
    pane?.querySelectorAll<HTMLElement>('.actions-wrangler-divider').forEach(divider => {
      const rows = Array.from(divider.parentElement?.querySelectorAll<HTMLElement>(WORKFLOW_ROW) || []);
      const visible = (section: string): boolean => rows.some(row => !row.hidden && row.dataset.wranglerSection === section);
      divider.hidden = !visible('favorites') || !visible('others');
      divider.style.display = divider.hidden ? 'none' : 'block';
    });
    status.textContent = !term ? '' : loading ? `Loading all workflows… (${count} matches so far)`
      : !complete ? `${count} matches in loaded workflows. Full list unavailable.`
      : count ? `${count} matching workflow${count === 1 ? '' : 's'}` : 'No matching workflows';
    retry.hidden = !term || loading || complete || !attempted;
  };
  const load = (): void => {
    if (composing || !input.value.trim() || loading || complete || !wrapper.isConnected) return;
    attempted = true;
    loading = true;
    filter();
    const releaseScroll = preserveSearchPosition(wrapper);
    const releaseFocus = preserveSearchFocus(input);
    expand(ok => {
      releaseFocus();
      releaseScroll();
      if (!wrapper.isConnected) return;
      loading = false;
      complete = ok;
      filter();
    });
  };
  input.addEventListener('compositionstart', () => {
    composing = true;
    input.dataset.composing = 'true';
    clear.disabled = true;
    clearTimeout(timer);
  });
  input.addEventListener('compositionend', () => {
    composing = false;
    delete input.dataset.composing;
    updateQuery();
  });
  const updateQuery = (): void => {
    query = input.value;
    filter();
    clearTimeout(timer);
    if (!attempted) timer = setTimeout(load, 250);
  };
  input.addEventListener('input', event => {
    if (composing || (event as InputEvent).isComposing) return;
    updateQuery();
  });
  const clearSearch = (): void => {
    input.value = '';
    updateQuery();
    input.focus({ preventScroll: true });
  };
  clear.addEventListener('click', clearSearch);
  input.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229 || composing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSearch();
    }
  });
  retry.addEventListener('click', load);
  wrapper.addEventListener('workflow-list-updated', filter);
  filter();
  if (query.trim()) timer = setTimeout(load, 250);
}

export function refreshSearch(): void {
  document.querySelector('.actions-workflow-search')?.dispatchEvent(new Event('workflow-list-updated'));
}

// GitHub may scroll a load-more button into view after an async response.
// Preserve each scroll container while loading, but yield immediately to the user.
function preserveSearchPosition(search: HTMLElement): () => void {
  const positions = new Map<HTMLElement, { top: number; left: number }>();
  for (let node = search.parentElement; node; node = node.parentElement) {
    if (node === document.scrollingElement || /(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
      positions.set(node, { top: node.scrollTop, left: node.scrollLeft });
    }
  }
  let active = true;
  const release = (): void => {
    active = false;
    document.removeEventListener('scroll', restore, true);
    document.removeEventListener('wheel', release, true);
    document.removeEventListener('touchstart', release, true);
    document.removeEventListener('pointerdown', release, true);
    document.removeEventListener('keydown', onKey, true);
  };
  const restore = (): void => {
    if (!active) return;
    if (!search.isConnected) { release(); return; }
    positions.forEach(({ top, left }, node) => {
      if (node.scrollTop !== top) node.scrollTop = top;
      if (node.scrollLeft !== left) node.scrollLeft = left;
    });
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.isComposing || event.keyCode === 229) return;
    if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'Escape', 'Tab'].includes(event.key)) release();
  };
  document.addEventListener('scroll', restore, true);
  document.addEventListener('wheel', release, { capture: true, passive: true });
  document.addEventListener('touchstart', release, { capture: true, passive: true });
  document.addEventListener('pointerdown', release, true);
  document.addEventListener('keydown', onKey, true);
  return release;
}

// Load-more handlers can focus a workflow link (or remove the focused button).
// Only retain an existing typing session, never take focus on initial navigation.
function preserveSearchFocus(input: HTMLInputElement): () => void {
  if (document.activeElement !== input) return () => {};
  const path = location.pathname;
  let active = true;
  const release = (): void => {
    active = false;
    input.removeEventListener('blur', onBlur);
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('blur', release);
  };
  const onBlur = (): void => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const direction = input.selectionDirection;
    // Let GitHub finish its synchronous focus change before restoring the caret.
    queueMicrotask(() => {
      if (!active || input.dataset.composing === 'true') return;
      if (!input.isConnected || location.pathname !== path) { release(); return; }
      input.focus({ preventScroll: true });
      if (start !== null && end !== null) input.setSelectionRange(start, end, direction || undefined);
    });
  };
  const onPointer = (event: PointerEvent): void => {
    if (event.target !== input) release();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Tab' || event.key === 'Escape') release();
  };
  input.addEventListener('blur', onBlur);
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('blur', release);
  return release;
}
