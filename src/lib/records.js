export const RECORD_CATEGORIES = { food: '美食', place: '地点', event: '事件' };
export function parsePoint(value) {
  if (value == null || String(value).trim() === '') return null;
  const parts = String(value).split(/[,，]/).map(part => part.trim());
  if (parts.length !== 2 || parts.some(part => !part)) throw new Error('地图坐标应为“经度,纬度”，请使用地图选点工具。');
  const [lng, lat] = parts.map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 85) throw new Error('地图坐标超出有效范围。');
  return { lng, lat };
}
export function parseRating(value, label = '评分') {
  if (value === undefined || value === null || String(value).trim() === '' || value === 'unrated') return null;
  const score = Number(value);
  if (!Number.isFinite(score) || score < 1 || score > 5 || !Number.isInteger(score * 2)) throw new Error(`${label}须为 1–5 星，支持半星。`);
  return score;
}
export function normalizeRecord(data) {
  const category = data.category || 'place';
  if (!(category in RECORD_CATEGORIES)) throw new Error('记录分类须为美食、地点或事件。');
  const dimensions = (Array.isArray(data.dimensions) ? data.dimensions : []).filter(item => item?.name?.trim() && item.score !== '' && item.score != null).map(item => ({ name: String(item.name).trim(), score: parseRating(item.score, item.name) })).filter(item => item.score !== null);
  if (new Set(dimensions.map(item => item.name)).size !== dimensions.length) throw new Error('评分维度不能重复。');
  const cost = data.cost === '' || data.cost == null ? null : Number(data.cost);
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) throw new Error('消费金额须为非负数。');
  const navigationUrl = String(data.navigationUrl || '').trim();
  if (navigationUrl && !/^https?:\/\//i.test(navigationUrl)) throw new Error('导航链接须以 https:// 或 http:// 开头。');
  return { category, rating: parseRating(data.rating), dimensions, placeName: String(data.placeName || '').trim(), city: String(data.city || '').trim(), address: String(data.address || '').trim(), point: parsePoint(data.mapPoint), navigationUrl, cost, recommended: String(data.recommended || '').trim() };
}
