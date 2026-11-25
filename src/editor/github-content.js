const API = 'https://api.github.com/repos/Li-yao114/haotlas.com';
const safeDocument = path => path === 'content/site.json' || /^content\/(records|writing|photography)\/[\p{L}\p{N}_(). -]+\.md$/u.test(path) && !path.includes('..');
const safeAsset = path => /^content\/(records\/assets|writing\/assets|photography\/photos|documents)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp|avif|gif|md|markdown|zip)$/i.test(path);
export const bytesBase64 = bytes => {
  let value = '';
  for (let n = 0; n < bytes.length; n += 8192) value += String.fromCharCode(...bytes.subarray(n, n + 8192));
  return btoa(value);
};
const contentText = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), char => char.charCodeAt(0)));

export function githubContent(token = '') {
  const request = async (path, options = {}) => {
    let response;
    try { response = await fetch(API + path, { ...options, headers: { Accept: 'application/vnd.github+json', ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}), 'X-GitHub-Api-Version': '2026-03-10', ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store', signal: AbortSignal.timeout(30000) }); } catch (error) { throw new Error(error.name === 'TimeoutError' ? '连接 GitHub 超时，当前编辑仍保留在浏览器，请稍后重试。' : '暂时无法连接 GitHub，当前编辑仍保留在浏览器，请稍后重试。'); }
    if (response.status === 404 && options.allowMissing) return null;
    const value = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error('GitHub 连接已失效，请重新连接。');
      if (response.status === 403) throw new Error('无法访问或写入仓库，请检查此仓库的内容权限；公共读取额度耗尽时也可以先连接 GitHub。');
      if (response.status === 409 || response.status === 422) throw new Error('仓库内容刚刚有更新，请重新载入后再保存。当前编辑仍保留在浏览器。');
      throw new Error(`GitHub 请求未完成（${response.status}），当前编辑仍保留在浏览器。`);
    }
    return value;
  };
  const json = (method, body) => ({ method, body: JSON.stringify(body) });
  const getFile = path => request(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=main`, { allowMissing: true });
  return {
    connect: () => request(''),
    async list(kind) {
      if (!['records', 'writing', 'photography'].includes(kind)) throw new Error('栏目无效。');
      const files = await request(`/contents/content/${kind}?ref=main`);
      return files.filter(file => file.type === 'file' && safeDocument(file.path));
    },
    async read(path) {
      if (!safeDocument(path)) throw new Error('内容文件地址无效。');
      const file = await getFile(path);
      if (!file) throw new Error('这份内容已被移动或删除。');
      if (file.encoding !== 'base64' || file.content == null) throw new Error('文件过大，无法在此编辑。');
      return { text: contentText(file.content), sha: file.sha, path };
    },
    async attachment(reference) {
      const path = String(reference).replace(/^\//, '');
      if (!path.startsWith('content/documents/') || !safeAsset(path)) throw new Error('导入文件地址无效。');
      let file = await getFile(path);
      if (!file || file.size > 40 * 1024 * 1024) throw new Error('导入文件不存在或大小超出限制。');
      if (file.encoding !== 'base64' || file.content == null) file = await request(`/git/blobs/${file.sha}`);
      const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), char => char.charCodeAt(0));
      return { blob: new Blob([bytes]), name: path.split('/').at(-1) };
    },
    async publish({ path, sha, text, assets = [] }) {
      if (!token.trim()) throw new Error('请先连接 GitHub。');
      if (!safeDocument(path)) throw new Error('只允许保存网站内容。');
      for (const asset of assets) if (!safeAsset(asset.path) || !(asset.blob instanceof Blob) || asset.blob.size > 40 * 1024 * 1024) throw new Error('附件地址或大小无效。');
      const current = await getFile(path);
      if ((current?.sha ?? null) !== sha) throw new Error('这份内容已在其他窗口修改，请先另存当前内容，再重新载入最新版本。');
      const entries = [];
      for (const asset of assets) {
        const blob = await request('/git/blobs', json('POST', { encoding: 'base64', content: bytesBase64(new Uint8Array(await asset.blob.arrayBuffer())) }));
        entries.push({ path: asset.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const reference = await request('/git/ref/heads/main');
      const base = await request(`/git/commits/${reference.object.sha}`);
      const latest = await getFile(path);
      if ((latest?.sha ?? null) !== sha) throw new Error('这份内容刚刚被其他窗口更新，当前编辑仍保留在浏览器。');
      const fileBlob = await request('/git/blobs', json('POST', { content: text, encoding: 'utf-8' }));
      entries.push({ path, mode: '100644', type: 'blob', sha: fileBlob.sha });
      const tree = await request('/git/trees', json('POST', { base_tree: base.tree.sha, tree: entries }));
      const commit = await request('/git/commits', json('POST', { message: `${sha ? 'Update' : 'Add'} content: ${path.split('/').at(-1)}`, tree: tree.sha, parents: [base.sha] }));
      await request('/git/refs/heads/main', json('PATCH', { sha: commit.sha, force: false }));
      return { sha: fileBlob.sha, commit: commit.sha, url: `https://github.com/Li-yao114/haotlas.com/commit/${commit.sha}` };
    },
  };
}
