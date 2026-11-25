import { unzipSync, strFromU8 } from 'fflate';
import { readRecord } from './record-document.js';
export async function importPreview(blob, name) {
  if (/\.(md|markdown)$/i.test(name)) {
    if (blob.size > 5 * 1024 * 1024) throw new Error('Markdown 请小于 5 MB。');
    return { body: readRecord(await blob.text()).body, images: [] };
  }
  if (!/\.zip$/i.test(name) || blob.size > 40 * 1024 * 1024) throw new Error('请选择小于 40 MB、含一篇 Markdown 的 ZIP。');
  let total = 0, count = 0;
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()), { filter(entry) {
    const parts = entry.name.replaceAll('\\', '/').split('/');
    if (entry.name.startsWith('/') || /^[a-z]:/i.test(entry.name) || parts.includes('..')) throw new Error('导入包包含不安全路径。');
    if (++count > 500 || (total += entry.originalSize) > 120 * 1024 * 1024 || entry.originalSize > 30 * 1024 * 1024) throw new Error('导入包文件过多或解压大小过大。');
    return !entry.name.startsWith('__MACOSX/') && !entry.name.endsWith('/') && !parts.at(-1).startsWith('.');
  } });
  const documents = Object.keys(files).filter(path => /\.(md|markdown)$/i.test(path));
  if (documents.length !== 1) throw new Error('ZIP 中请只放一篇 Markdown 和它的图片文件夹。');
  const file = documents[0], folder = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
  const images = Object.entries(files).filter(([path]) => /\.(png|jpe?g|webp|avif|gif)$/i.test(path)).map(([path, bytes]) => ({ path: path.startsWith(folder) ? path.slice(folder.length) : path, blob: new Blob([bytes], { type: /\.png$/i.test(path) ? 'image/png' : /\.gif$/i.test(path) ? 'image/gif' : /\.webp$/i.test(path) ? 'image/webp' : /\.avif$/i.test(path) ? 'image/avif' : 'image/jpeg' }) }));
  return { body: readRecord(strFromU8(files[file])).body, images };
}
