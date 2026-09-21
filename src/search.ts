type Expand = (done: (complete: boolean) => void) => void;
let query = '';
let repository = '';

// State belongs to the rendered sidebar; a Turbo replacement gets a fresh load.
export function setupSearch(expand: Expand): void {
  const repo = location.pathname.split('/').slice(1, 3).join('/');
  if (repo !== repository) { repository = repo; query = ''; }
  const all = document.querySelector('a.ActionListContent[href$="/actions"]')?.closest('li');
  if (!all || document.querySelector('.actions-workflow-search')) return;
  const wrapper = document.createElement('li');
  wrapper.className = 'actions-workflow-search';
  wrapper.style.cssText = 'list-style:none;padding:8px;';
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'form-control';
  input.placeholder = 'Search workflows…';
  input.setAttribute('aria-label', 'Search workflows by name or filename');
  input.style.width = '100%';
  input.value = query;
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'font-size:12px;color:var(--fgColor-muted, #656d76);margin-top:4px;';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn btn-sm';
  retry.textContent = 'Retry loading';
  retry.hidden = true;
  wrapper.append(input, status, retry);
  all.after(wrapper);
  let loading = false;
  let attempted = false;
  let complete = false;
  let timer: ReturnType<typeof setTimeout>;

  const filter = (): void => {
    const term = input.value.trim().toLocaleLowerCase();
    let count = 0;
    const pane = wrapper.closest('[data-target="split-page-layout.pane"]') || wrapper.parentElement?.parentElement;
    pane?.querySelectorAll<HTMLElement>('li.actions-workflow-list-item').forEach(row => {
      const link = row.querySelector<HTMLAnchorElement>('a.ActionListContent');
      let filename = link?.pathname.split('/').pop() || '';
      try { filename = decodeURIComponent(filename); } catch { /* Keep malformed names searchable. */ }
      const match = !term || `${link?.textContent || ''} ${filename}`.toLocaleLowerCase().includes(term);
      row.hidden = !match;
      // GitHub's list styles can override the UA hidden rule.
      if (match) row.style.removeProperty('display');
      else row.style.setProperty('display', 'none', 'important');
      if (match) count++;
    });
    status.textContent = !term ? '' : loading ? `Loading all workflows… (${count} matches so far)`
      : !complete ? `${count} matches in loaded workflows. Full list unavailable.`
      : count ? `${count} matching workflow${count === 1 ? '' : 's'}` : 'No matching workflows';
    retry.hidden = !term || loading || complete || !attempted;
  };
  const load = (): void => {
    if (!input.value.trim() || loading || complete || !wrapper.isConnected) return;
    attempted = true;
    loading = true;
    filter();
    expand(ok => {
      if (!wrapper.isConnected) return;
      loading = false;
      complete = ok;
      filter();
    });
  };
  input.addEventListener('input', () => {
    query = input.value;
    filter();
    clearTimeout(timer);
    if (!attempted) timer = setTimeout(load, 250);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      input.value = '';
      input.dispatchEvent(new Event('input'));
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
