import { readRecord } from './record-document.js';

const API = 'https://api.github.com/repos/Li-yao114/haotlas.com';
const safeDocument = path => path === 'content/site.json' || /^content\/(records|writing|photography)\/[\p{L}\p{N}_(). -]+\.md$/u.test(path) && !path.includes('..');
const safeAsset = path => /^content\/(records\/assets|writing\/assets|photography\/photos|documents)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|avif|gif|md|markdown|zip)$/i.test(path);
const metadataCache = new Map();
export class PublishError extends Error {
  constructor(message, code, status) { super(message); this.name = 'PublishError'; this.code = code; this.status = status; }
}
export const bytesBase64 = bytes => {
  let value = '';
  for (let n = 0; n < bytes.length; n += 8192) value += String.fromCharCode(...bytes.subarray(n, n + 8192));
  return btoa(value);
};
const contentBytes = value => Uint8Array.from(atob(value.replace(/\s/g, '')), char => char.charCodeAt(0));
const contentText = value => new TextDecoder().decode(contentBytes(value));
export async function gitBlobSha(text) {
  const body = new TextEncoder().encode(text), header = new TextEncoder().encode(`blob ${body.length}\0`), bytes = new Uint8Array(header.length + body.length);
  bytes.set(header); bytes.set(body, header.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
}
const json = (method, body) => ({ method, body: JSON.stringify(body) });
const canceled = signal => signal?.reason instanceof PublishError ? signal.reason : new PublishError('已停止等待。草稿仍在；如提交已到达 GitHub，重试时会先核对结果。', 'ABORTED');
function remember(path, sha, text) {
  if (path.endsWith('.json')) return;
  try { metadataCache.set(sha, readRecord(text).data); } catch { /* Listing can read it again later. */ }
}
export function githubContent(token = '', settings = {}) {
  async function request(path, options = {}) {
    const { signal, allowMissing, timeoutMs = settings.requestTimeoutMs || 25000, ...init } = options;
    if (signal?.aborted) throw canceled(signal);
    const controller = new AbortController();
    let timer, abort;
    const interrupted = new Promise((_, reject) => {
      abort = () => { const error = canceled(signal); controller.abort(error); reject(error); };
      signal?.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => { const error = new PublishError('这一步连接超时，草稿仍保留，可以重试。', 'TIMEOUT'); controller.abort(error); reject(error); }, timeoutMs);
    });
    try {
      return await Promise.race([(async () => {
        let response;
        try {
          response = await fetch(API + path, { ...init, headers: { Accept: 'application/vnd.github+json', ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}), 'X-GitHub-Api-Version': '2026-03-10', ...(init.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store', signal: controller.signal });
        } catch {
          if (signal?.aborted) throw canceled(signal);
          throw new PublishError('暂时无法连接 GitHub。草稿仍保留，可以重试。', 'NETWORK');
        }
        if (response.status === 404 && allowMissing) return null;
        let value;
        try { value = await response.json(); } catch { throw new PublishError('GitHub 回应未能完整读取，重试时会先核对保存结果。', 'RESPONSE'); }
        if (!response.ok) {
          if (response.status === 401) throw new PublishError('GitHub 连接已失效，请重新连接后重试。', 'AUTH', 401);
          if (response.status === 403 || response.status === 429) throw new PublishError(response.headers.get('x-ratelimit-remaining') === '0' || response.status === 429 ? 'GitHub 暂时限制了请求次数，请稍后重试。' : '此连接没有足够权限。请确认只授权 haotlas.com，并将 Contents 设置为 Read and write。', 'PERMISSION', response.status);
          if ([409, 422].includes(response.status) && ['PUT', 'PATCH'].includes(init.method)) throw new PublishError('GitHub 中的版本发生变化，需要重新核对。当前草稿没有丢失。', 'CONFLICT', response.status);
          throw new PublishError(`GitHub 未完成这一步（${response.status}）。草稿仍保留。`, 'REQUEST', response.status);
        }
        return value;
      })(), interrupted]);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  const getFile = (path, options = {}) => request(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=main`, { ...options, allowMissing: true });
  const conflict = () => new PublishError('这份内容已在 GitHub 中修改。请点“核对 GitHub 版本”；本地修改可以先另存为新草稿。', 'CONFLICT');
  return {
    async connect() {
      const repo = await request('');
      if (repo.full_name?.toLowerCase() !== 'li-yao114/haotlas.com') throw new PublishError('GitHub 连接结果未能确认，请重新连接。', 'RESPONSE');
      return repo;
    },
    async list(kind, { signal, knownEntries = [] } = {}) {
      if (!['records', 'writing', 'photography'].includes(kind)) throw new Error('栏目无效。');
      const files = await request(`/contents/content/${kind}?ref=main`, { signal });
      if (!Array.isArray(files)) throw new Error('内容列表未能读取，请刷新列表。');
      const result = files.filter(file => file.type === 'file' && safeDocument(file.path));
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.min(3, result.length) }, async () => {
        while (cursor < result.length) {
          const index = cursor++, file = result[index];
          try {
            const known = knownEntries.find(item => item.file?.replace(/^\//, '') === file.path && item.sourceSha === file.sha);
            let data = metadataCache.get(file.sha);
            if (!data && known) data = { title: known.title, date: known.date, draft: false };
            if (!data) {
              const value = await getFile(file.path, { signal, timeoutMs: 10000 });
              if (value?.encoding === 'base64' && value.content != null) data = readRecord(contentText(value.content)).data;
            }
            if (data) { metadataCache.set(file.sha, data); result[index] = { ...file, title: data.title || file.name.replace(/\.md$/, ''), state: data.draft === true ? 'github-draft' : 'published', date: data.date }; }
            else result[index] = { ...file, state: 'unknown' };
          } catch (error) {
            if (signal?.aborted) throw error;
            result[index] = { ...file, state: 'unknown' };
          }
        }
      }));
      return result;
    },
    async read(path) {
      if (!safeDocument(path)) throw new Error('内容文件地址无效。');
      let file = await getFile(path);
      if (!file) throw new Error('这份内容已被移动或删除。');
      const sha = file.sha;
      if (file.encoding !== 'base64' || file.content == null) file = await request(`/git/blobs/${sha}`);
      const text = contentText(file.content);
      remember(path, sha, text);
      return { text, sha, path };
    },
    async attachment(reference) {
      const path = String(reference).replace(/^\//, '');
      if (!path.startsWith('content/documents/') || !safeAsset(path)) throw new Error('导入文件地址无效。');
      let file = await getFile(path);
      if (!file || file.size > 40 * 1024 * 1024) throw new Error('导入文件不存在或大小超出限制。');
      if (file.encoding !== 'base64' || file.content == null) file = await request(`/git/blobs/${file.sha}`);
      return { blob: new Blob([contentBytes(file.content)]), name: path.split('/').at(-1) };
    },
    async publish({ path, sha, text, assets = [], previousAttempt, signal: parentSignal, onProgress = () => {}, onAssetUploaded = () => {} }) {
      if (!token.trim()) throw new PublishError('请先连接 GitHub。', 'AUTH');
      if (!safeDocument(path)) throw new Error('只允许保存网站内容。');
      for (const asset of assets) if (!safeAsset(asset.path) || !(asset.blob instanceof Blob) || asset.blob.size > 40 * 1024 * 1024) throw new Error('附件地址或大小无效。');
      const controller = new AbortController();
      const abort = () => controller.abort(parentSignal.reason);
      if (parentSignal?.aborted) throw canceled(parentSignal);
      parentSignal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(new PublishError('本次等待已达到三分钟，草稿与上传进度已保留。可重试继续。', 'TOTAL_TIMEOUT')), settings.publishTimeoutMs || 180000);
      const signal = controller.signal, total = assets.length + 5;
      let step = 0;
      const report = (label, phase) => { if (signal.aborted) throw canceled(signal); onProgress({ label, phase, step, total }); };
      let targetSha;
      const saved = (current, commit, recovered = false) => {
        remember(path, current.sha, text);
        return { sha: current.sha, commit: commit?.sha || null, url: commit?.html_url || (commit?.sha ? `https://github.com/Li-yao114/haotlas.com/commit/${commit.sha}` : current.html_url || `https://github.com/Li-yao114/haotlas.com/blob/main/${path}`), recovered };
      };
      try {
        targetSha = await gitBlobSha(text);
        report('核对 GitHub 中的保存结果…', 'check');
        let current = await getFile(path, { signal });
        if (current?.sha === targetSha) { step = total; report('内容已经保存，无需重复提交。', 'done'); return saved(current, null, true); }
        let expectedSha = sha;
        if (previousAttempt?.targetSha && current?.sha === previousAttempt.targetSha) expectedSha = current.sha;
        if ((current?.sha ?? null) !== expectedSha) throw conflict();
        step++;
        if (!assets.length) {
          report('正在保存正文到 GitHub…', 'save');
          let result;
          try { result = await request(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`, { ...json('PUT', { message: `${current ? 'Update' : 'Add'} content: ${path.split('/').at(-1)}`, content: bytesBase64(new TextEncoder().encode(text)), branch: 'main', ...(current ? { sha: current.sha } : {}) }), signal }); }
          catch (error) {
            if (signal.aborted) throw error;
            const verified = await getFile(path, { signal, timeoutMs: 6000 }).catch(() => null);
            if (verified?.sha === targetSha) return saved(verified, null, true);
            throw error;
          }
          if (result.content?.sha !== targetSha) throw new PublishError('GitHub 保存结果未能确认，重试时会重新核对。', 'RESPONSE');
          step = total; report('GitHub 已确认保存。', 'done'); return saved(result.content, result.commit);
        }
        const entries = [];
        for (let n = 0; n < assets.length; n++) {
          const asset = assets[n];
          report(`${asset.remoteSha ? '复用已上传附件' : '正在上传附件'} ${n + 1}/${assets.length}${asset.name ? `：${asset.name}` : ''}`, 'upload');
          let blobSha = asset.remoteSha;
          if (!/^[0-9a-f]{40}$/.test(blobSha || '')) {
            const blob = await request('/git/blobs', { ...json('POST', { encoding: 'base64', content: bytesBase64(new Uint8Array(await asset.blob.arrayBuffer())) }), signal, timeoutMs: settings.uploadTimeoutMs || 90000 });
            blobSha = blob.sha;
            await onAssetUploaded({ path: asset.path, remoteSha: blobSha });
          }
          entries.push({ path: asset.path, mode: '100644', type: 'blob', sha: blobSha }); step++;
        }
        report('附件已上传，正在保存正文…', 'save');
        const fileBlob = await request('/git/blobs', { ...json('POST', { content: text, encoding: 'utf-8' }), signal });
        entries.push({ path, mode: '100644', type: 'blob', sha: fileBlob.sha }); step++;
        for (let attempt = 0; attempt < 2; attempt++) {
          report(attempt ? '仓库有新更新，正在重新核对…' : '正在合并正文与附件…', 'commit');
          const reference = await request('/git/ref/heads/main', { signal });
          const base = await request(`/git/commits/${reference.object.sha}`, { signal });
          current = await getFile(path, { signal });
          if (current?.sha === targetSha) return saved(current, null, true);
          if ((current?.sha ?? null) !== expectedSha) throw conflict();
          const tree = await request('/git/trees', { ...json('POST', { base_tree: base.tree.sha, tree: entries }), signal });
          const commit = await request('/git/commits', { ...json('POST', { message: `${current ? 'Update' : 'Add'} content: ${path.split('/').at(-1)}`, tree: tree.sha, parents: [base.sha] }), signal });
          step = total - 1; report('正在确认提交…', 'confirm');
          try { await request('/git/refs/heads/main', { ...json('PATCH', { sha: commit.sha, force: false }), signal }); }
          catch (error) {
            if (signal.aborted) throw error;
            const verified = await getFile(path, { signal, timeoutMs: 6000 }).catch(() => null);
            if (verified?.sha === targetSha) return saved(verified, commit, true);
            if (error.code === 'CONFLICT' && !attempt) continue;
            throw error;
          }
          step = total; report('GitHub 已确认保存。', 'done'); return saved({ sha: fileBlob.sha }, commit);
        }
      } finally { clearTimeout(timer); parentSignal?.removeEventListener('abort', abort); }
    },
  };
}
