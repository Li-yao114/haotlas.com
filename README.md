# Haotlas

个人文稿与摄影网站，已按 B“夜航”视觉整合。

日常写文章、添加摄影手记与发布的完整步骤见 [PUBLISHING.md](PUBLISHING.md)。

## 本地使用

需要 Node.js 22.12 或更高版本。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。用 Obsidian 或 Typora 打开 `content/writing`，保存 Markdown 后会自动更新预览，不再编辑 JSON 索引。

```sh
npm run new -- "我的新文稿"
npm run new:photo -- "我的摄影手记"
npm run build
npm run preview
```

新建命令生成草稿。写好后把 `draft: true` 改为 `false`。`build` 先更新内容与照片，再生成 `dist`。正式网站更新仍需部署 `dist`；本地保存不会自动推送到线上。

## 文稿格式

```yaml
---
title: 我的新文稿
date: 2026-11-19
tags: [随笔]
summary: 可选；留空会从正文生成。
draft: false
---
```

文件放在 `content/writing`，支持子目录。正文为普通 Markdown，支持表格、代码、相对路径图片以及 Obsidian 的 `![[图片.png]]`。图片需保存在 `content` 内，路径相对文稿文件；带空格可用 `![](<附件/我的图片.png>)`。没有正文的文章自动保留为草稿。可选 `slug` 用于固定文章地址；已有文章保留原来的 slug。

索引、正文和全文检索文件在启动或构建时生成到 `public/content`，不应手工编辑。草稿的正文和附件不会复制到网站公开目录；但公开 GitHub 仓库中的草稿源码仍可被查看。不要将整个 Obsidian vault 或 `content` 原始目录直接作为静态托管根目录。

## 摄影手记与感悟

摄影现已和文稿一样分成列表与单篇详情：`/photography/` 展示所有手记，点开标题或封面进入 `/photography/文章slug/`。每篇可以放一张或多张照片，照片下面显示这篇 Markdown 的感悟正文。新增内容会自动进入摄影列表、首页与搜索。

最快的新建方式：

```sh
npm run new:photo -- "沿江散步"
```

会同时生成 Markdown 草稿和同名照片目录。把照片放入目录，在 Markdown 正文写下感悟，然后将 `draft: true` 改为 `false`。正文支持小标题、分段、引用、列表等普通 Markdown。摘要用于摄影列表，正文显示在单篇页面的“照片之外”区域；没有正文时不显示空白感悟区域。

原片放在 `content/photography` 内。可以继续在相册 Markdown 正文中引用照片，或在相册头部指定文件夹：

```yaml
---
title: 一组新照片
date: 2026-11-19
folder: 新相册
showLocation: false
draft: false
---

## 写在照片之后

在这里写拍摄时的感受、走过的地方，或者回头再看照片时的新想法。
```

例如相册文件为 `content/photography/2026-11-19-新相册.md`，原片目录为 `content/photography/新相册/`。目录内 JPG、PNG、WebP、AVIF、TIFF 自动按文件名自然顺序收录。精确排序可用 `images` 列表（相对相册路径），每项支持 `src` 和 `caption`。`cover` 可指定这篇已收录照片中的一张作为封面，留空默认使用第一张。

导入阶段读取真实 EXIF（机身、镜头、光圈、快门、ISO、焦距、拍摄时间），自动矫正方向，生成 480、960、1600、2400 像素 WebP。缺失参数不猜测。原图保留在内容目录，访客读取处理后的图片，灯箱使用最大 2400 像素版本。

GPS 默认不公开；相册显式设置 `showLocation: true` 才输出约百米精度坐标。浏览图片本身不保留 EXIF、GPS。拍摄时间保持原片记录的时间，有时区字段时单独保存。记录日期与拍摄日期分开，避免把导入日期当拍摄日期。

## 已选定的 B 版

已将 B“夜航”正式整合到 React 主站：深色画廊、宽幅影像、细线索引和低装饰排版；保留浅色、深色、跟随系统三种主题及已有选择，首次访问默认深色。页面、文章和摄影手记均有独立 HTML 地址，支持刷新与浏览器返回，也为搜索引擎提供完整正文。

底部保留“本站已运行”，每秒更新，起点仍为 **2023-10-31 21:15:09（北京时间）**，不会随访客时区变化。“重庆夜色”文案已删去“站台”，并在照片下显示原有感悟文字。

`design-demos` 保留之前的三版设计参考，正式预览请打开网站首页，不再使用旧的独立演示。旧演示中的文字不代表当前主站。

## 本次整理

- CRA 构建替换为轻量 Vite，移除未使用的测试、性能统计及旧构建依赖。
- Markdown 成为唯一文稿来源，12 篇公开文章；3 篇空稿仅保留在本地，不随本次仓库同步发布。
- 相册真实 EXIF 替换手工参数，5 张照片的 1600 像素版本共约 2.58 MiB，对应原图约 153.13 MiB。
- 去掉 260ms 人为切页等待，URL 可保存页面和文章位置，支持刷新与浏览器返回；页面按需载入，内容请求缓存。
- 主题在首帧前生效，并支持系统变化和跨标签同步；搜索按需读取全文索引。

## 验证与保留问题

`npm test` 检查元数据、GPS、路径与日期处理；`npm run build` 检查可发布构建。桌面 1440px 与手机 375px 下检查正式站布局、导航、搜索、主题、灯箱与运行计时。另以临时第二篇手记验证多篇摄影、单张照片、正文和返回流程，测试内容在检查后移除。

原文中的图片仍有指向 `haotlas.cn/wp-content` 的外链，未擅自替换或批量下载；以后可逐步迁入本地附件。列表见 `docs/content-report.json`。未编入相册的另外 6 张原片仍保留。原摄影手记中记录日期为 2024-11-20，但原片 EXIF 是 2025-11-23；两者分别保留。`docs/legacy-*.json` 保存旧手工索引供核对。

参考：
- [AstroPaper](https://github.com/satnaing/astro-paper)：内容优先的布局、阅读与可访问性思路。
- [next-themes](https://github.com/pacocoursey/next-themes)：首帧应用主题、系统模式、持久化的交互原则，未引入 Next.js 依赖。
- [exifr](https://github.com/MikeKovarik/exifr)：照片元数据解析。
- [sharp](https://sharp.pixelplumbing.com/)：照片方向和浏览尺寸处理。

通过 main 分支的 Publish Haotlas 工作流自动构建，并更新现有 gh-pages 网站；域名继续使用 haotlas.com。
