import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { pathToFileURL } from 'node:url';
import { hrefFor } from '../src/lib/navigation.js';

const origin = 'https://haotlas.com';
const root = process.cwd();
const writing = JSON.parse(await readFile('public/content/writing/index.json', 'utf8'));
const photography = JSON.parse(await readFile('public/content/photography/index.json', 'utf8'));
const records = JSON.parse(await readFile('public/content/records/index.json', 'utf8'));
const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const template = await readFile('dist/index.html', 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const dataJSON = value => JSON.stringify(value).replaceAll('<', '\\u003c');
await build({ build: { ssr: 'tools/render-page.jsx', outDir: '.cache/render', emptyOutDir: true, copyPublicDir: false, rolldownOptions: { output: { entryFileNames: 'render-page.mjs' } } } });
const pages = [{ page: 'home' }, { page: 'writing' }, { page: 'photography' }, { page: 'records' }, { page: 'about' }, ...writing.map(post => ({ page: 'writing', slug: post.slug, post })), ...photography.map(post => ({ page: 'photography', slug: post.slug, post })), ...records.map(post => ({ page: 'records', slug: post.slug, post }))];
try {
  const { renderPage } = await import(pathToFileURL(path.join(root, '.cache/render/render-page.mjs')).href);
  for (const item of [...pages, { page: 'missing' }]) {
    const { page, slug, post } = item;
    const route = page === 'missing' ? '/404.html' : hrefFor(page, slug);
    const canonical = origin + route;
    const title = post ? `${post.title} — Haotlas` : page === 'home' ? 'Haotlas — 文稿、摄影与长期记录' : `${{ writing: site.pages.writingTitle, photography: site.pages.photographyTitle, records: site.pages.recordsTitle, about: site.about.title, missing: '页面未收录' }[page]} — Haotlas`;
    const description = post?.summary || 'Haotlas 的个人网站，记录技术学习、读书感悟、摄影和生活。';
    const body = post ? await readFile(path.join(root, 'public', decodeURIComponent(post.file)), 'utf8') : null;
    const markup = renderPage({ page, slug, writing, photography, records, body });
    const preload = { writing, photography, records, file: post?.file || null, body };
    const image = post?.cover ? origin + post.cover : origin + '/logo512.png';
    const structured = post ? {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
      description, datePublished: post.date.length > 10 ? `${post.date.replace(' ', 'T')}+08:00` : `${post.date}T00:00:00+08:00`,
      author: { '@type': 'Person', name: 'Haotlas', url: origin + '/about/' }, mainEntityOfPage: canonical,
      ...((page === 'photography' || page === 'records') ? { image: post.images.map(image => origin + image.src) } : {}),
    } : { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Haotlas', url: origin, description, inLanguage: 'zh-CN' };
    const head = `<link rel="canonical" href="${escape(canonical)}"><meta name="robots" content="${page === 'missing' ? 'noindex' : 'index,follow,max-image-preview:large'}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:type" content="${post ? 'article' : 'website'}"><meta property="og:image" content="${escape(image)}"><script type="application/ld+json">${dataJSON(structured)}</script><script type="application/json" id="page-data">${dataJSON(preload)}</script>`;
    let html = template.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`).replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${escape(description)}">`).replace(/<meta\s+property="og:[^"]+"[^>]*>/g, '').replace('</head>', head + '</head>').replace('<div id="root"></div>', `<div id="root">${markup}</div>`).replace(/<noscript>[\s\S]*?<\/noscript>/, '');
    const destination = path.join(root, 'dist', route === '/404.html' ? '404.html' : decodeURIComponent(route), route === '/404.html' ? '' : 'index.html');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(item => `<url><loc>${escape(origin + hrefFor(item.page, item.slug))}</loc></url>`).join('')}</urlset>`;
  await writeFile('dist/sitemap.xml', sitemap);
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  await writeFile('dist/version.json', JSON.stringify({ version: pkg.version, builtAt: new Date().toISOString(), source: process.env.GITHUB_SHA || null }) + '\n');
  console.log(`已生成 ${pages.length} 个可直接阅读和抓取的页面、404页面及站点地图。`);
} finally { /* All generated content is written into dist, never into the source vault. */ }
