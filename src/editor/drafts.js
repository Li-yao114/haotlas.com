const TIMEOUT = 8000;
let writeQueue = Promise.resolve();
function database() {
  return new Promise((resolve, reject) => {
    let finished = false;
    const request = indexedDB.open('haotlas-content-editor', 1);
    const timer = setTimeout(() => { finished = true; reject(new Error('本地草稿库响应超时，请关闭其他后台标签页后重试。')); }, TIMEOUT);
    const fail = error => { if (!finished) { finished = true; clearTimeout(timer); reject(error); } };
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('drafts')) request.result.createObjectStore('drafts', { keyPath: 'path' }); };
    request.onerror = () => fail(request.error || new Error('无法打开本地草稿库。'));
    request.onblocked = () => fail(new Error('其他后台窗口占用了草稿库，请关闭旧窗口后重试。'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (finished) { db.close(); return; }
      finished = true; clearTimeout(timer); resolve(db);
    };
  });
}
async function transaction(method, value, verify = false) {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    let finished = false;
    const operation = db.transaction('drafts', ['getAll', 'get'].includes(method) ? 'readonly' : 'readwrite');
    const timer = setTimeout(() => { if (!finished) { finished = true; try { operation.abort(); } catch {} reject(new Error('本地草稿保存超时，请先下载备份后重试。')); } }, TIMEOUT);
    const request = operation.objectStore('drafts')[method](...(value === undefined ? [] : [value]));
    let result;
    request.onsuccess = () => { if (verify) { const check = operation.objectStore('drafts').get(value.path); check.onsuccess = () => { result = check.result; }; } else result = request.result; };
    const end = callback => { if (!finished) { finished = true; clearTimeout(timer); callback(); } };
    operation.oncomplete = () => end(() => resolve(result));
    operation.onerror = operation.onabort = () => end(() => reject(operation.error || new Error('本地草稿未保存成功，可能是浏览器存储空间不足。')));
  }); } finally { db.close(); }
}
export function draftStore(method, value) {
  if (['getAll', 'get'].includes(method)) return writeQueue.catch(() => {}).then(() => transaction(method, value));
  const operation = writeQueue.catch(() => {}).then(() => transaction(method, value));
  writeQueue = operation;
  return operation;
}
export async function persistDraft(value) {
  const operation = writeQueue.catch(() => {}).then(() => transaction('put', value, true));
  writeQueue = operation;
  const saved = await operation;
  if (!saved || saved.body !== value.body || saved.updated !== value.updated) throw new Error('草稿保存结果未能确认，请保留当前页面并下载备份。');
  return saved;
}
