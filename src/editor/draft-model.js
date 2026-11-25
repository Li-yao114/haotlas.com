const text = value => typeof value === 'string' && value.trim().length > 0;
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
export const draftFingerprint = entry => JSON.stringify(sorted({ data: entry.data || {}, body: entry.body || '' }));
export function hasDraftContent(entry, assets = entry?.assets || []) {
  if (!entry?.data) return false;
  if (entry.kind === 'site') return true;
  const data = entry.data;
  return ['title', 'summary', 'recommended', 'placeName', 'city', 'address', 'mapPoint', 'sourceDocument'].some(key => text(data[key])) || text(entry.body) || !!data.images?.length || !!data.tags?.some(text) || assets.some(asset => asset.blob?.size > 0) || Object.values(data.foodRating || {}).some(value => value != null && value !== 'unrated') || (data.cost != null && data.cost !== '') || (data.rating != null && data.rating !== '' && data.rating !== 'unrated');
}
export function localDraftStatus(entry) {
  if (entry.trashedAt) return 'trash';
  if (!hasDraftContent(entry)) return entry.keepEmpty ? 'local' : 'empty';
  if (entry.baseline && entry.baseline === draftFingerprint(entry)) return entry.data.draft === true ? 'github-draft' : 'published';
  if (entry.sha && !entry.baseline) return 'unverified';
  return 'local';
}
export function libraryEntries(locals, files, kind) {
  const remote = new Map(files.map(file => [file.path, { path: file.path, title: file.title || file.name.replace(/\.md$/, ''), status: file.state || 'unknown', remote: file, updated: file.updated || 0 }]));
  const trash = [];
  for (const local of locals.filter(item => item.kind === kind)) {
    const status = localDraftStatus(local);
    if (status === 'empty') continue;
    const base = remote.get(local.path);
    const item = { ...base, path: local.path, title: local.data.title || '未命名草稿', local, status, updated: local.updated || 0, excerpt: String(local.data.summary || local.body || '').replace(/[#*`>]/g, '').trim().slice(0, 90), characters: (local.body || '').trim().length, photos: local.data.images?.length || 0 };
    if (status === 'trash') trash.push(item);
    else if (base && ['published', 'github-draft'].includes(status) && base.remote.sha !== local.sha) remote.set(local.path, { ...base, local });
    else remote.set(local.path, item);
  }
  return [...remote.values(), ...trash].sort((a, b) => b.updated - a.updated || a.title.localeCompare(b.title, 'zh-CN'));
}
export function filterLibrary(entries, filter, query = '') {
  const search = query.trim().toLocaleLowerCase();
  return entries.filter(item => {
    const match = filter === 'local' ? ['local', 'unverified'].includes(item.status) : filter === 'drafts' ? item.status === 'github-draft' : filter === 'published' ? item.status === 'published' || item.remote?.state === 'published' : filter === 'trash' ? item.status === 'trash' : item.status !== 'trash';
    return match && (!search || `${item.title} ${item.excerpt || ''}`.toLocaleLowerCase().includes(search));
  });
}
