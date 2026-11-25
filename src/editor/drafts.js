const database = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('haotlas-content-editor', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'path' });
  request.onerror = () => reject(request.error); request.onsuccess = () => resolve(request.result);
});
export async function draftStore(method, value) {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', method === 'getAll' ? 'readonly' : 'readwrite');
    const request = transaction.objectStore('drafts')[method](...(value === undefined ? [] : [value]));
    let result; request.onsuccess = () => { result = request.result; };
    transaction.oncomplete = () => resolve(result); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
  }); } finally { db.close(); }
}
