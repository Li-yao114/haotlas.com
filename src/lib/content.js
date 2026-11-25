const requests = new Map();

export function getPageData() {
  if (typeof document === 'undefined') return null;
  try { return JSON.parse(document.getElementById('page-data')?.textContent || 'null'); }
  catch { return null; }
}

const initial = getPageData();
if (initial) {
  requests.set('json:/content/writing/index.json', Promise.resolve(initial.writing));
  requests.set('json:/content/photography/index.json', Promise.resolve(initial.photography));
  if (Array.isArray(initial.records)) requests.set('json:/content/records/index.json', Promise.resolve(initial.records));
  if (initial.file) requests.set(`text:${initial.file}`, Promise.resolve(initial.body));
}

export function getInitialMarkdown(file) {
  return initial?.file === file ? initial.body : null;
}

function cachedRequest(path, format) {
  const key = `${format}:${path}`;
  if (!requests.has(key)) {
    const request = fetch(path).then(response => {
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error(`无法加载内容：${path}`);
      return response[format]();
    }).catch(error => { requests.delete(key); throw error; });
    requests.set(key, request);
  }
  return requests.get(key);
}

export function loadJson(path) { return cachedRequest(path, 'json'); }
export async function loadMarkdown(path) {
  const text = await cachedRequest(path, 'text');
  return { body: text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trim() };
}
export async function loadWritingIndex() { return [...await loadJson('/content/writing/index.json')]; }
export async function loadPhotographyIndex() { return [...await loadJson('/content/photography/index.json')]; }

export async function loadRecordsIndex() { return [...await loadJson('/content/records/index.json')]; }
