import { parse, stringify } from 'yaml';
import { normalizeRecord } from '../lib/records.js';

export function readRecord(text) {
  text = String(text).replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { data: {}, body: String(text) };
  const data = parse(match[1], { maxAliasCount: 50 }) || {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('记录的文件头格式无效。');
  return { data, body: text.slice(match[0].length).trimStart() };
}
export function writeRecord(data, body) {
  const title = String(data.title || '').trim();
  if (!title) throw new Error('请填写记录标题。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date)) || (!Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date)) throw new Error('请选择有效日期。');
  if (data.slug && (/^https?:\/\//i.test(data.slug) || data.slug.split(/[\\/]/).some(part => ['.', '..'].includes(part)))) throw new Error('记录地址请填写名称，不要填写完整网址或相对路径。');
  const normalized = normalizeRecord(data);
  if (!data.draft && normalized.ratingMode === 'weighted' && normalized.rating === null) throw new Error('发布前请完成口味、服务态度、环境三项评分；也可以先保存草稿。');
  const metadata = { ...data, title, rating: normalized.rating ?? 'unrated' };
  if (!metadata.sourceDocument) delete metadata.sourceDocument;
  return `---\n${stringify(metadata, { lineWidth: 0 })}---\n\n${String(body || '').trim()}\n`;
}
export function newRecord() {
  const id = crypto.randomUUID();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const date = ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  return { id, path: `content/records/${date}-${id.slice(0, 8)}.md`, sha: null, data: { title: '', date, category: 'food', draft: true, slug: `${date}-${id.slice(0, 8)}`, summary: '', foodRating: { taste: null, service: null, environment: null }, ratingMode: 'weighted', images: [], cover: '', placeName: '', city: '', address: '', mapPoint: '', cost: '', recommended: '' }, body: '' };
}
export const sourceImageUrl = path => path.startsWith('https:') ? path : `https://raw.githubusercontent.com/Li-yao114/haotlas.com/main/${String(path).replace(/^\//, '')}`;
