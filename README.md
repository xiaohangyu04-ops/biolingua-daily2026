# BioLingua Daily — 免费静态版

## 你不需要安装 Python

### 本地直接使用
1. 解压 ZIP。
2. 双击 `index.html`。
3. 可以使用：TED、历史内容、发音、收藏、测验、间隔复习。

注意：部分浏览器在 `file://` 模式下会限制读取旁边的 JSON 文件。如果你双击后看不到历史内容，直接使用下面的 GitHub Pages 免费在线方案即可。

### 推荐：免费上线 + 每天自动保存历史

这个项目已经包含：
- `.github/workflows/update.yml`
- `scripts/update.mjs`
- `data/manifest.json`

把整个文件夹上传到 GitHub 仓库后：
1. 打开仓库 Settings → Pages。
2. Source 选择 `Deploy from a branch`。
3. 选择 `main` 分支和 `/ (root)`。
4. 保存。
5. 打开 Actions，允许工作流运行。

之后 GitHub Actions 会每天运行一次，自动生成：
`data/YYYY-MM-DD.json`

因此每天都会留下独立快照，可以长期回溯。

### 个人学习记录
收藏单词、复习进度保存在浏览器 localStorage：
- 免费
- 关闭网页后仍保留
- 但换设备/清浏览器数据不会同步

如以后需要手机/电脑同步，可再接 Supabase/Firebase 免费额度。

### TED
TED 使用官方嵌入播放器和官方 Transcript 链接，不复制完整讲稿。
