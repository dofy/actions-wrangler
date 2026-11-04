# Workflow Harbor — Chrome Web Store listing

## English

**Short description:** Find and organize your favorite GitHub Actions workflows.

**Detailed description:**

Find the workflow you need without scrolling through a long GitHub Actions sidebar. Workflow Harbor adds personal favorites and a fast search field to your repository's Actions pages.

- Search by workflow name or filename; load remaining pages automatically.
- Save personal favorites per repository and see them in a dedicated section.
- Keep GitHub's native pins at the top of each section.
- Expand all workflows with one click or enable automatic expansion.
- Clear search with Esc, with input-method and focus safeguards.
- Use English or Simplified Chinese automatically based on Chrome's language.

Favorites and preferences use Chrome sync storage. No GitHub token is required. This is an independent community fork of Actions Wrangler and is not affiliated with GitHub.

## 简体中文

**简短说明：** 搜索并整理你收藏的 GitHub Actions 工作流。

**详细说明：**

不用在 GitHub Actions 的长列表里反复寻找工作流。Workflow Harbor 为仓库的 Actions 页面添加个人收藏和快速搜索。

- 按工作流名称或文件名搜索，并自动加载其余分页。
- 按仓库保存个人收藏，在顶部独立区域查看。
- 每个区域优先显示 GitHub 原生置顶项。
- 一键展开全部工作流，也可以开启自动展开。
- 点击或按 Esc 清除搜索，兼顾中文输入法和输入焦点。
- 根据 Chrome 语言自动显示简体中文或英文。

收藏和设置使用 Chrome 同步存储，无需 GitHub 令牌。本扩展是 Actions Wrangler 的独立社区分支，与 GitHub 无关联。

## Privacy and permission disclosures

Single purpose: Help users find and organize GitHub Actions workflows.

- `storage`: Save personal workflow favorites and preferences with Chrome sync.
- `tabs`: Inspect tab URLs to show the correct toolbar icon.
- `https://github.com/*`: Detect navigation to Actions and read and update the Actions sidebar; GitHub's own pagination controls load more workflows.
- Remote code: No remotely hosted executable code; bundled scripts ship in the extension.
- Privacy policy: https://github.com/dofy/actions-wrangler/blob/main/PRIVACY.md (publish the updated file before using this URL).
