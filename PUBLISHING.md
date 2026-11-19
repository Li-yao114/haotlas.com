# 写作、摄影与网站同步

网站：https://haotlas.com
源码：https://github.com/Li-yao114/haotlas.com

## 日常最省事的流程

1. 用 Obsidian 或 Typora 编辑本项目 `content` 里的 Markdown。
2. 本地保存后，正在运行的预览会自动更新。
3. 写好后将文稿头部的 `draft: true` 改成 `draft: false`。
4. 用你现有的 Git 工具提交并推送到 `main`；如果用 GitHub Desktop，提交后点击 **Push origin**。
5. GitHub 的 **Actions → Publish Haotlas** 自动构建并更新网站。等发布检查完成后再刷新网站，通常需要几分钟。

保存到电脑和更新到互联网是两步：保存用于本地记录，Push origin 才会同步到 GitHub 并触发发布。不要手工改 `dist`、`public/content` 或 `gh-pages` 分支。

也可以在项目终端同步这次新增或修改的内容：

```sh
git add content
git commit -m "更新文稿与摄影"
git push origin main
```

## 添加文章

文章放在 `content/writing`，每篇一个 `.md`。可直接复制已有文稿，修改标题、日期及正文；不要复制别人的 `slug`，删除该项后会按新文件名生成。

也可以在项目终端运行：

```sh
npm run new -- "今天的读书笔记"
```

例如：

```markdown
---
title: 今天的读书笔记
date: 2026-11-20
tags: [阅读]
summary: 一句话说明这篇记录。
draft: false
---

## 读到的一句话

在这里写正文。
```

图片放在文稿旁边或 `content` 的附件目录中，以相对路径插入。支持普通 Markdown 图片，以及 Obsidian 的 `![[图片.png]]`。图片也要一起提交和同步。

## 添加摄影手记

```sh
npm run new:photo -- "沿江散步"
```

会生成两个位置：一份 Markdown 草稿，以及同名照片文件夹。把照片放进文件夹，在 Markdown 正文写感悟。摘要出现在摄影列表，正文出现在照片下方的“照片之外”。

```markdown
---
title: 沿江散步
date: 2026-11-20
folder: 2026-11-20-沿江散步
summary: 河岸边停下来的几个片刻。
showLocation: false
draft: false
---

## 写在照片之后

把拍摄时的感受、一路上的经历，或者回头再看照片的新想法写在这里。
```

照片会自动读取原片中的相机、镜头、光圈、快门、ISO、焦距和拍摄时间，并生成网站浏览尺寸；没有的信息留空。文件夹里的图片按文件名自然排序，可以命名为 `01.jpg`、`02.jpg`。优先使用导出的 JPG 或 WebP，自己的原始底片另行备份。

需要精确选择、排序或写图注时，删除 `folder`，改用：

```yaml
images:
  - src: 我的照片/01.jpg
    caption: 河岸上的灯光。
  - src: 我的照片/02.jpg
cover: 我的照片/01.jpg
```

每篇摄影手记都有独立网址，之后增加第二篇、第三篇无需改网页代码，首页、摄影列表与搜索会自动更新。

## 草稿与公开范围

`draft: true` 控制是否出现在网站中。这个 GitHub 仓库是公开仓库，已提交到仓库里的源码仍可被查看。本次只同步网站已发布的内容，原有空白草稿和未选用的照片已列入本地忽略清单。真正私密的日记请放在不参与同步的 `content/drafts` 或项目之外。

`showLocation: false` 默认不在网站输出 GPS；只有明确改成 `true`，且原图包含位置时，才显示经过取整的拍摄坐标。

## 本地预览与检查

```sh
npm ci
npm run dev
```

打开显示的本地地址，保存内容即可刷新。发布前可运行 `npm test` 和 `npm run build` 检查。

## 搜索与收录

网站里的搜索会随每次发布立即更新。文章和摄影有独立 HTML 地址、正文、标题、摘要和站点地图：https://haotlas.com/sitemap.xml 。

Google、百度等外部搜索引擎何时收录由其抓取流程决定，不能保证发布后立刻出现。需要加快发现时，可以在自己已验证的网站管理平台中提交站点地图；没有验证账户时，不需要为了日常写作先做这一步。
