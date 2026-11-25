import { readFile, writeFile, mkdir, readdir, rm, cp, rename, stat, open } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import exifr from 'exifr';
import sharp from 'sharp';
import { normalizeRecord } from '../src/lib/records.js';
import { importDocument } from './import-document.mjs';
import { safePath, dateString, plainText, readingMinutes, photoMetadata } from './content-utils.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'content');
const CACHE = path.join(ROOT, '.cache/photos');
const STAGING = path.join(ROOT, '.cache/content-next');
const OUTPUT = path.join(ROOT, 'public/content');
const WIDTHS = [480, 960, 1600, 2400];
const FORMAT_VERSION = 1;
const compareDate = (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + '\n');
}

async function listMarkdown(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(e => !e.name.startsWith('.')).map(async entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? listMarkdown(file) : entry.name.endsWith('.md') ? [file] : [];
  }));
  return nested.flat().sort();
}

function makePost(data, body, relative) {
  const title = String(data.title || path.basename(relative, '.md')).trim();
  const slug = String(data.slug || path.basename(relative, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')).trim();
  if (!title || !slug) throw new Error(`标题或 slug 为空：${relative}`);
  if (slug.split(/[\\/]/).some(part => ['.', '..'].includes(part)) || slug.includes('\0')) throw new Error(`内容地址包含无效路径：${relative}`);
  const plain = plainText(body);
  return {
    slug, title, date: dateString(data.date, path.basename(relative).slice(0, 10)),
    summary: String(data.summary || plain.slice(0, 100)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    lang: String(data.lang || 'zh'),
    file: `/content/${relative.split(path.sep).join('/')}`,
    readingMinutes: readingMinutes(body),
  };
}

async function processPhoto(source, { caption = '', showLocation = false, kind = 'photography' } = {}) {
  const buffer = await readFile(source);
  const hash = createHash('sha256').update(buffer).update(String(FORMAT_VERSION)).digest('hex').slice(0, 16);
  const cacheFolder = path.join(CACHE, hash);
  const infoFile = path.join(cacheFolder, 'metadata.json');
  let cached;
  try { cached = JSON.parse(await readFile(infoFile, 'utf8')); } catch { /* generate below */ }
  if (!cached) {
    await mkdir(cacheFolder, { recursive: true });
    const raw = await sharp(buffer).metadata();
    const tags = await exifr.parse(buffer, { translateValues: true, reviveValues: false }) || {};
    const swap = [5, 6, 7, 8].includes(raw.orientation);
    const width = swap ? raw.height : raw.width;
    const height = swap ? raw.width : raw.height;
    const sizes = [...new Set(WIDTHS.map(w => Math.min(w, width)))];
    const variants = [];
    for (const target of sizes) {
      const filename = `${hash}-${target}.webp`;
      // Auto-rotate, convert to sRGB and discard EXIF/GPS in browser assets.
      await sharp(buffer).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: target >= 1600 ? 84 : 80 }).toFile(path.join(cacheFolder, filename));
      variants.push({ width: target, filename, bytes: (await stat(path.join(cacheFolder, filename))).size });
    }
    cached = { width, height, originalBytes: buffer.length, variants, metadata: photoMetadata(tags, { showLocation: true }) };
    await writeJson(infoFile, cached);
  }
  await mkdir(path.join(STAGING, kind, 'photos'), { recursive: true });
  for (const variant of cached.variants) {
    await cp(path.join(cacheFolder, variant.filename), path.join(STAGING, kind, 'photos', variant.filename));
  }
  const url = variant => `/content/${kind}/photos/${variant.filename}`;
  const regular = cached.variants.find(v => v.width >= 1600) || cached.variants.at(-1);
  const metadata = { ...cached.metadata };
  if (!showLocation) { delete metadata.lat; delete metadata.lng; }
  return {
    source: path.basename(source), src: url(regular), thumb: url(cached.variants[0]),
    full: url(cached.variants.at(-1)),
    srcSet: cached.variants.map(v => `${url(v)} ${v.width}w`).join(', '),
    width: cached.width, height: cached.height, caption, ...metadata,
    originalBytes: cached.originalBytes,
    displayBytes: regular.bytes,
  };
}

function galleryImages(data, body) {
  if (Array.isArray(data.images) && data.images.length) return data.images.map(image => typeof image === 'string' ? { src: image } : image);
  return [...body.matchAll(/!\[([^\]]*)\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)]
    .map(match => ({ src: match[2] || match[3], caption: match[1] }));
}

async function prepareWritingAssets(body, file, resolver, kind = 'writing') {
  // Obsidian's pasted-image syntax and standard Markdown use the same asset path.
  let result = body.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, source, alt) => `![${alt || ''}](<${source}>)`);
  const matches = [...result.matchAll(/!\[([^\]]*)\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)];
  for (const match of matches.reverse()) {
    const src = match[2] || match[3];
    if (/^(https?:|data:|\/\/)/i.test(src)) continue;
    const decoded = decodeURIComponent(src);
    const sourceFile = resolver ? null : decoded.startsWith('/content/')
      ? safePath(SOURCE, decoded.slice(9))
      : safePath(SOURCE, path.join(path.relative(SOURCE, path.dirname(file)), decoded));
    const { buffer, source } = resolver ? await resolver(src) : { buffer: await readFile(sourceFile), source: sourceFile };
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const extension = path.extname(source).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'].includes(extension)) throw new Error(`不支持的文稿图片：${src}`);
    const name = `${hash}${extension}`;
    const destination = path.join(STAGING, kind, 'assets', name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, buffer);
    result = result.slice(0, match.index) + `![${match[1]}](/content/${kind}/assets/${name})` + result.slice(match.index + match[0].length);
  }
  return result;
}

async function buildCollection() {
  const site = JSON.parse(await readFile(path.join(SOURCE, 'site.json'), 'utf8'));
  for (const section of ['home', 'pages', 'about', 'footer']) {
    if (!site[section] || Object.values(site[section]).some(value => typeof value !== 'string')) throw new Error(`站点文案 ${section} 应为文字字段。`);
  }
  await rm(STAGING, { recursive: true, force: true });
  await mkdir(path.join(STAGING, 'writing'), { recursive: true });
  await mkdir(path.join(STAGING, 'photography/photos'), { recursive: true });
  const writing = [], photography = [], records = [], search = [], report = { drafts: [], empty: [], externalImages: [], photos: [] };
  const slugs = new Set();
  try {
    for (const kind of ['writing', 'photography', 'records']) {
      for (const file of await listMarkdown(path.join(SOURCE, kind))) {
        const relative = path.relative(SOURCE, file);
        const raw = await readFile(file, 'utf8');
        const { data, content: originalBody } = matter(raw);
        if (data.draft === true) { report.drafts.push(relative); continue; }
        let body = originalBody, resolver;
        if (data.sourceDocument) { const imported = await importDocument(data.sourceDocument, SOURCE); body = imported.body; resolver = imported.asset; }
        // Draft source is never copied into public, even when it has a body.
        const empty = kind === 'records' ? !String(data.title || '').trim() : !body.trim() && (kind === 'writing' || (!data.folder && !data.images?.length));
        if (data.draft === true || empty) {
          report.drafts.push(relative);
          if (empty) report.empty.push(relative);
          continue;
        }
        const post = makePost(data, body, relative);
        const key = `${kind}/${post.slug}`;
        if (slugs.has(key)) throw new Error(`重复 slug：${key}`);
        slugs.add(key);
        let publicBody = body;
        if (kind === 'photography') {
          let images = galleryImages(data, body);
          if (data.folder) {
            const folder = safePath(SOURCE, path.join(path.dirname(relative), data.folder));
            images = (await readdir(folder)).filter(n => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(n)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(n => ({ src: path.relative(path.dirname(file), path.join(folder, n)) }));
          }
          post.images = [];
          for (const image of images) {
            if (!image?.src || /^https?:/i.test(image.src)) throw new Error(`相册照片请放入本地内容目录：${relative}`);
            const decoded = decodeURIComponent(image.src);
            const source = decoded.startsWith('/content/')
              ? safePath(SOURCE, decoded.slice('/content/'.length))
              : safePath(SOURCE, path.join(path.dirname(relative), decoded));
            const processed = await processPhoto(source, { caption: String(image.caption || ''), showLocation: data.showLocation === true });
            post.images.push(processed);
            report.photos.push({ album: post.title, ...processed });
          }
          if (!post.images.length) throw new Error(`相册没有照片：${relative}`);
          const captureDates = post.images.map(image => image.takenAt?.slice(0, 10)).filter(Boolean).sort();
          if (captureDates.length) post.date = captureDates[0];
          const preferredCover = data.cover ? path.basename(decodeURIComponent(String(data.cover))) : null;
          post.cover = (post.images.find(image => image.source === preferredCover) || post.images[0]).src;
          // The gallery owns the images: don't download/render them twice in prose.
          publicBody = body.replace(/!\[[^\]]*\]\((?:<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g, '').trim();
          photography.push(post);
        } else if (kind === 'records') {
          Object.assign(post, normalizeRecord(data));
          post.images = [];
          for (const image of (Array.isArray(data.images) ? data.images : [])) {
            const src = typeof image === 'string' ? image : image.src;
            if (!src || /^https?:/i.test(src)) throw new Error('记录照片请从本地素材库上传。');
            const decoded = decodeURIComponent(src);
            const source = decoded.startsWith('/content/') ? safePath(SOURCE, decoded.slice(9)) : safePath(SOURCE, path.join(path.dirname(relative), decoded));
            post.images.push(await processPhoto(source, { caption: typeof image === 'string' ? '' : String(image.caption || ''), kind: 'records' }));
          }
          const preferred = data.cover ? path.basename(decodeURIComponent(String(data.cover))) : null;
          post.cover = (post.images.find(image => image.source === preferred) || post.images[0])?.src || null;
          publicBody = await prepareWritingAssets(body, file, resolver, kind);
          records.push(post);
        } else {
          publicBody = await prepareWritingAssets(body, file, resolver);
          writing.push(post);
          const links = [...body.matchAll(/!\[[^\]]*\]\((https?:[^\s)]+)/g)].map(m => m[1]);
          if (links.length) report.externalImages.push({ file: relative, count: links.length, urls: links });
        }
        const target = safePath(STAGING, relative);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, publicBody.trim() + '\n');
        search.push({ ...post, text: [plainText(publicBody), post.placeName, post.city, post.address, post.recommended, ...(post.dimensions || []).map(item => item.name)].filter(Boolean).join(' ') });
      }
    }
    writing.sort(compareDate); photography.sort(compareDate); records.sort(compareDate);
    await writeJson(path.join(STAGING, 'writing/index.json'), writing);
    await writeJson(path.join(STAGING, 'photography/index.json'), photography);
    await writeJson(path.join(STAGING, 'records/index.json'), records);
    await writeJson(path.join(STAGING, 'search.json'), search.map(({ images, ...entry }) => entry));
    await writeJson(path.join(ROOT, '.cache/content-report.json'), report);
    // Replace only after the complete collection passes validation.
    const previous = `${OUTPUT}-previous`;
    await rm(previous, { recursive: true, force: true });
    await mkdir(path.dirname(OUTPUT), { recursive: true });
    try { await rename(OUTPUT, previous); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await rename(STAGING, OUTPUT); } catch (error) {
      try { await rename(previous, OUTPUT); } catch { /* original failure is more useful */ }
      throw error;
    }
    await rm(previous, { recursive: true, force: true });
    console.log(`内容已更新：${writing.length} 篇文稿，${photography.length} 组摄影，${records.length} 条记录，${report.drafts.length} 篇草稿。`);
    return { writing, photography, records, report };
  } catch (error) {
    await rm(STAGING, { recursive: true, force: true });
    throw error;
  }
}

// The preview watcher and a production build may run at the same time.
// Serialize their writes so that the public collection is replaced as one unit.
export async function buildContent() {
  const lockFile = path.join(ROOT, '.cache/content-build.lock');
  await mkdir(path.dirname(lockFile), { recursive: true });
  let lock;
  for (let attempt = 0; attempt < 600; attempt++) {
    try {
      lock = await open(lockFile, 'wx');
      await lock.writeFile(String(process.pid));
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = Number(await readFile(lockFile, 'utf8').catch(() => ''));
      if (owner) {
        try { process.kill(owner, 0); }
        catch (error) { if (error.code === 'ESRCH') await rm(lockFile, { force: true }); }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  if (!lock) throw new Error('内容更新仍在进行，请稍后重试。');
  try { return await buildCollection(); }
  finally { await lock.close(); await rm(lockFile, { force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildContent().catch(error => { console.error(error.message); process.exitCode = 1; });
}
