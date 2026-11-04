const en = {
  unfold: 'Unfold all workflows', search: 'Search workflows…', searchLabel: 'Search workflows by name or filename', clear: 'Clear workflow search', clearTitle: 'Clear search (Esc)', retry: 'Retry loading',
  loading: 'Loading all workflows… ($1 matches so far)', incomplete: '$1 matches in loaded workflows. Full list unavailable.', matchingOne: '$1 matching workflow', matchingMany: '$1 matching workflows', noMatches: 'No matching workflows',
  pin: 'Pin $1 (extension)', unpin: 'Unpin $1 (extension)', others: 'Other workflows',
  auto: 'Auto Unfold', autoHelp: 'Automatically expand all workflows on page load', reset: 'Reset All Pinned Workflows', resetHelp: 'Clears all extension-pinned workflows across all repos', resetConfirm: 'This will clear all extension-pinned workflows across all repositories. Continue?', resetting: 'Resetting...', noPins: 'No pinned workflows to clear', cleared: 'Cleared $1 repo(s)', changelog: 'Changelog',
  v130a: 'Choose English or Chinese automatically from the browser language', v130b: 'New Workflow Harbor name and icon',
  v122a: 'Support the new collapsible GitHub Actions sidebar', v122b: 'Keep favorites, search and pagination working across sidebar layouts', v122c: 'Align native pin buttons and selection markers after navigation', v122d: 'Keep the unfold button on the right with a simpler arrow icon',
  v121a: 'Activate automatically when navigating into Actions without a page refresh', v121b: 'Esc clear button appears only while search has text', v121c: 'Keep search focus after clearing', v121d: 'Updated popup changelog through v1.2.1',
  v120a: 'Support the updated GitHub Actions sidebar', v120b: 'Gray favorite stars before workflow names', v120c: 'Separate favorites and other workflows', v120d: 'Native pins first in each section; other favorites sorted alphabetically', v120e: 'Native hover styling and rounded outer edges',
  v110a: 'Search workflows by name or filename', v110b: 'Automatic pagination during search', v110c: 'Workflow-page pinning and navigation fixes', v110d: 'Search scroll, focus, and IME safeguards'
} as const;
const zh: Record<keyof typeof en, string> = {
  unfold: '展开全部工作流', search: '搜索工作流…', searchLabel: '按名称或文件名搜索工作流', clear: '清除工作流搜索', clearTitle: '清除搜索（Esc）', retry: '重试加载',
  loading: '正在加载全部工作流…（目前匹配 $1 个）', incomplete: '已加载的工作流中匹配 $1 个，完整列表暂不可用。', matchingOne: '匹配 $1 个工作流', matchingMany: '匹配 $1 个工作流', noMatches: '没有匹配的工作流',
  pin: '收藏 $1（扩展）', unpin: '取消收藏 $1（扩展）', others: '其他工作流',
  auto: '自动展开', autoHelp: '打开页面时自动加载全部工作流', reset: '清除全部收藏', resetHelp: '清除此扩展在所有仓库中的收藏', resetConfirm: '这会清除此扩展在所有仓库中的工作流收藏。确定继续吗？', resetting: '正在清除…', noPins: '没有需要清除的收藏', cleared: '已清除 $1 个仓库的收藏', changelog: '更新记录',
  v130a: '根据浏览器语言自动显示中文或英文', v130b: '启用 Workflow Harbor 新名称和图标',
  v122a: '适配 GitHub Actions 新版可收起侧栏', v122b: '兼容不同侧栏的收藏、搜索和分页', v122c: '修正切换工作流后的原生按钮与选中标记', v122d: '展开按钮固定在右侧并更新图标',
  v121a: '站内跳转进入 Actions 时无需刷新', v121b: '搜索有内容时显示 Esc 清除按钮', v121c: '清除后保持搜索框焦点', v121d: '更新扩展内的更新记录',
  v120a: '适配 GitHub Actions 新版侧栏', v120b: '工作流名称前显示灰色收藏星标', v120c: '分别展示收藏和其他工作流', v120d: '各区域原生置顶优先，其余收藏按字母排序', v120e: '统一悬停效果与外侧圆角',
  v110a: '按工作流名称或文件名搜索', v110b: '搜索时自动加载分页', v110c: '修复工作流详情页收藏与导航', v110d: '保护搜索滚动、焦点与输入法输入'
};
export function t(key: keyof typeof en, value?: string | number): string {
  const language = chrome.i18n?.getUILanguage?.() || 'en';
  const text = /^zh(?:-|_|$)/i.test(language) ? zh[key] : en[key];
  return value === undefined ? text : text.replace('$1', String(value));
}
