# BioLingua Daily v12 — 真日更去重版

解决两个核心问题：

1. 新闻每天重复
- 先查过去 24 小时
- 没有新内容再扩展到 3 天、7 天
- 用 `data/news_history.json` 记录历史标题
- 已出现过的标题自动跳过

2. TED 每天重复
- TED 不再写死在网页 JS 里
- 每天由 GitHub Actions 从 `data/ted_catalog.json` 选一个“从未用过”的 TED
- `data/ted_history.json` 记录已经学过的 slug
- 如果 catalog 全部用完，系统宁可当天不生成 TED，也不会重复旧 TED

页面仍保留：
- 中英文新闻速览
- 双语摘要
- 专家解读
- 新闻好句中英对照 + 朗读
- 每日英语重点
- TED 双语学习、朗读、Shadowing、感悟
- 单词收藏

## 你在 GitHub 上要替换的文件
- index.html
- scripts/update.mjs
- .github/workflows/update.yml
- data/ted_catalog.json
- data/news_history.json
- data/ted_history.json
- data/manifest.json
- data/2026-10-10.json（示例，可留着）

重要：`news_history.json` 和 `ted_history.json` 不能每天删除，它们就是“防重复记忆”。
