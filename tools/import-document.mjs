import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { unzipSync, strFromU8 } from 'fflate';
import { safePath } from './content-utils.mjs';

const MAX_TOTAL = 120 * 1024 * 1024;
function safeEntry(name) {
  const decoded = name.replaceAll('\\', '/');
  if (decoded.startsWith('/') || /^[a-z]:/i.test(decoded) || decoded.split('/').includes('..')) throw new Error('导入包包含不安全路径。');
  return path.posix.normalize(decoded);
}
export function unpackDocument(buffer) {
  if (buffer.length > 40 * 1024 * 1024) throw new Error('导入包请控制在 40 MB 以内。');
  let total = 0, count = 0;
  const entries = unzipSync(buffer, { filter(file) {
    safeEntry(file.name);
    if (++count > 500 || (total += file.originalSize) > MAX_TOTAL || file.originalSize > 30 * 1024 * 1024) throw new Error('导入包的文件数量或解压大小过大。');
    return !file.name.startsWith('__MACOSX/') && !file.name.endsWith('/') && !path.posix.basename(file.name).startsWith('.');
  } });
  const normalized = new Map(Object.entries(entries).map(([name, bytes]) => [safeEntry(name), bytes]));
  const markdown = [...normalized.keys()].filter(name => /\.(md|markdown)$/i.test(name));
  if (markdown.length !== 1) throw new Error('每个 ZIP 请只放一篇 Markdown，以及这篇文章使用的图片文件夹。');
  const main = markdown[0];
  return {
    body: matter(strFromU8(normalized.get(main)).replace(/^\uFEFF/, '')).content,
    async asset(src) {
      if (src.startsWith('/')) throw new Error('ZIP 内配图请使用相对路径。');
      const name = path.posix.normalize(path.posix.join(path.posix.dirname(main), decodeURIComponent(src)));
      const bytes = normalized.get(name);
      if (!bytes) throw new Error(`导入包缺少配图：${src}`);
      return { buffer: Buffer.from(bytes), source: name };
    },
  };
}
export async function importDocument(reference, sourceRoot) {
  const decoded = decodeURIComponent(String(reference));
  const file = safePath(sourceRoot, decoded.startsWith('/content/') ? decoded.slice(9) : decoded);
  const bytes = await readFile(file);
  if (/\.zip$/i.test(file)) return unpackDocument(bytes);
  if (!/\.(md|markdown)$/i.test(file) || bytes.length > 5 * 1024 * 1024) throw new Error('请选择 .md、.markdown 或包含一篇文稿的 ZIP。');
  return { body: matter(bytes.toString('utf8').replace(/^\uFEFF/, '')).content, async asset(src) {
    const source = src.startsWith('/content/') ? safePath(sourceRoot, decodeURIComponent(src).slice(9)) : safePath(sourceRoot, path.relative(sourceRoot, path.resolve(path.dirname(file), decodeURIComponent(src))));
    try { return { buffer: await readFile(source), source }; } catch { throw new Error(`缺少配图：${src}。请将 Markdown 与图片文件夹一起打成 ZIP 导入。`); }
  } };
}
