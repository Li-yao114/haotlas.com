import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import ThemeToggle from '../components/theme/ThemeToggle';
import Modal from '../components/Modal';
import MarkdownContent from '../components/MarkdownContent';
import StarRating from '../components/StarRating';
import RecordsMap from '../components/RecordsMap';
import RecordLocation from '../components/RecordLocation';
import { FOOD_CRITERIA, normalizeRecord } from '../lib/records';
import { readRecord, entryText, newRecord, sourceImageUrl } from './record-document';
import { githubContent, gitBlobSha } from './github-content';
import { draftStore, persistDraft } from './drafts';
import { draftFingerprint, hasDraftContent, localDraftStatus } from './draft-model';
import DraftLibrary from './DraftLibrary';
import { imageAsset } from './uploads';
import { importPreview } from './import-preview';
import PlaceSearch from './PlaceSearch';
import StarSlider from './StarSlider';
import '../index.css';
import './location.css';
import './content.css';

const names = { writing: '文稿', photography: '摄影手记', records: '记录', site: '网站文案' };
const EMPTY = [];
const newEntry = kind => {
  const record = newRecord();
  if (kind === 'records') return { ...record, kind };
  return { ...record, kind, path: record.path.replace('/records/', `/${kind}/`), data: { title: '', date: record.data.date, draft: true, slug: record.data.slug, summary: '', tags: [], ...(kind === 'photography' ? { images: [], cover: '', showLocation: false } : {}) } };
};
const defaultTab = () => ['writing', 'photography', 'records', 'site'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'records';
function Field({ label, hint, children, wide = false }) { const id = React.useId(); return <div className={`editor-field${wide ? ' field-wide' : ''}`}><label htmlFor={id}>{label}</label>{React.cloneElement(children, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })}{hint && <small id={`${id}-hint`}>{hint}</small>}</div>; }
function ImageTile({ image, index, count, url, onCaption, onRemove, onMove, cover, onCover, onInsert }) {
  return <div className="editor-image-tile"><img src={url} alt={image.caption || '已添加的照片'} loading="lazy" /><input aria-label={`第 ${index + 1} 张图片说明`} placeholder="图片说明（可选）" value={image.caption || ''} onChange={event => onCaption(event.target.value)} /><div><button type="button" onClick={onCover} aria-pressed={cover}>{cover ? '封面' : '设为封面'}</button>{onInsert && <button type="button" onClick={onInsert}>插入正文</button>}<button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`前移第 ${index + 1} 张图片`}>前移</button><button type="button" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`后移第 ${index + 1} 张图片`}>后移</button><button type="button" onClick={onRemove}>移除</button></div></div>;
}
function ContentApp() {
  const [kind, setKind] = useState(defaultTab), [entry, setEntry] = useState(null), [assets, setAssets] = useState([]), [imports, setImports] = useState([]);
  const [client, setClient] = useState(() => githubContent()), [connected, setConnected] = useState(false), [connection, setConnection] = useState(false), [token, setToken] = useState(''), [connectionError, setConnectionError] = useState('');
  const [files, setFiles] = useState([]), [localDrafts, setLocalDrafts] = useState([]), [index, setIndex] = useState({}), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [message, setMessage] = useState(''), [saveState, setSaveState] = useState(''), [preview, setPreview] = useState(false), [focusPoint, setFocusPoint] = useState(null), [ready, setReady] = useState(false), [commitUrl, setCommitUrl] = useState(''), [publication, setPublication] = useState(null), [publishResult, setPublishResult] = useState(null), [elapsed, setElapsed] = useState(0), [reloadList, setReloadList] = useState(0);
  const bodyInput = useRef(null), uploadInput = useRef(null), importInput = useRef(null), current = useRef(null), operation = useRef(null), trashed = useRef(new Set()), pendingIntent = useRef(null);
  current.current = { entry, assets, imports };
  const urls = useMemo(() => [...assets, ...imports].map(asset => ({ path: asset.path, url: URL.createObjectURL(asset.blob) })), [assets, imports]);
  useEffect(() => () => urls.forEach(item => URL.revokeObjectURL(item.url)), [urls]);
  const imageUrl = useCallback(path => {
    const local = urls.find(item => item.path === path.replace(/^\//, '')); if (local) return local.url;
    const collection = index[kind] || [], photo = collection.flatMap(item => item.images || []).find(image => image.source === path.split('/').at(-1));
    return photo?.thumb || sourceImageUrl(path);
  }, [urls, index, kind]);
  const activate = (value, nextAssets = value?.assets || [], nextImports = value?.imports || []) => {
    current.current = { entry: value, assets: nextAssets, imports: nextImports };
    setEntry(value); setAssets(nextAssets); setImports(nextImports);
  };
  const storeValue = useCallback(async (value, force = false) => {
    if (!value.entry || trashed.current.has(value.entry.path) || !hasDraftContent(value.entry, value.assets)) return null;
    if (!force && value.entry.baseline === draftFingerprint(value.entry)) return null;
    const saved = await persistDraft({ ...value.entry, assets: value.assets, imports: value.imports, updated: Date.now() });
    setLocalDrafts(await draftStore('getAll'));
    return saved;
  }, []);
  const storeCurrent = useCallback((force = false) => storeValue(current.current, force), [storeValue]);
  const savedLabel = value => value ? `${localDraftStatus(value) === 'published' ? '已保存已发布内容的本地副本' : localDraftStatus(value) === 'github-draft' ? 'GitHub 草稿的本地备份已保存' : '本地草稿已保存'} · ${new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(value.updated)}` : hasDraftContent(current.current.entry, current.current.assets) ? (current.current.entry?.data.draft ? '已同步为 GitHub 草稿' : '已与 GitHub 同步') : '尚未填写内容，不保存空白占位';
  const saveLocal = async () => {
    try { const saved = await storeCurrent(true); setSaveState(savedLabel(saved)); if (!saved && !hasDraftContent(current.current.entry, current.current.assets)) setMessage('请先填写标题、正文或添加图片，再保存草稿。'); }
    catch (error) { setSaveState(error.message); setMessage(error.message); }
  };
  useEffect(() => {
    draftStore('getAll').then(async values => {
      let blank = 0;
      for (const value of values) if (!value.trashedAt && !hasDraftContent(value)) { value.trashedAt = Date.now(); value.trashReason = 'empty-placeholder'; try { await persistDraft(value); blank++; } catch { delete value.trashedAt; delete value.trashReason; } }
      trashed.current = new Set(values.filter(value => value.trashedAt).map(value => value.path));
      setLocalDrafts(values);
      const latest = values.filter(value => value.kind === defaultTab() && !value.trashedAt && !['published', 'empty'].includes(localDraftStatus(value))).sort((a, b) => b.updated - a.updated)[0];
      if (latest) activate(latest);
      else if (defaultTab() !== 'site') activate(newEntry(defaultTab()));
      if (blank) setMessage(`已将 ${blank} 份空白占位移入回收站，已有文字和图片的草稿原样保留。`);
      setReady(true);
    }).catch(error => { setSaveState(error.message || '不能自动保存草稿，请下载备份。'); activate(newEntry(defaultTab() === 'site' ? 'records' : defaultTab())); setReady(true); });
  }, []);
  useEffect(() => {
    if (!ready || !entry || busy) return;
    if (!hasDraftContent(entry, assets)) { setSaveState('尚未填写内容，不保存空白占位'); return; }
    if (entry.baseline === draftFingerprint(entry)) { setSaveState(entry.data.draft ? '已同步为 GitHub 草稿' : '已与 GitHub 同步'); return; }
    const path = entry.path, fingerprint = draftFingerprint(entry);
    setSaveState('正在保存这份本地草稿…');
    const timer = setTimeout(() => storeCurrent().then(saved => { if (current.current.entry?.path === path && draftFingerprint(current.current.entry) === fingerprint) setSaveState(savedLabel(saved)); }).catch(error => setSaveState(error.message)), 500);
    return () => clearTimeout(timer);
  }, [entry, assets, imports, ready, busy, storeCurrent]);
  useEffect(() => {
    const save = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void saveLocal(); } };
    addEventListener('keydown', save); return () => removeEventListener('keydown', save);
  }, [storeCurrent]);
  useEffect(() => {
    if (!publication) { setElapsed(0); return; }
    const start = Date.now(), timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [!!publication]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 35000);
    if (kind === 'site') {
      client.read('content/site.json').then(file => { if (!controller.signal.aborted && current.current.entry?.kind !== 'site') { const value = { kind: 'site', path: file.path, sha: file.sha, data: JSON.parse(file.text), body: '' }; value.baseline = draftFingerprint(value); activate(value); } }).catch(error => !controller.signal.aborted && setMessage(error.message));
    } else {
      setLoading(true);
      (async () => {
        const knownEntries = await fetch(`/content/${kind}/index.json`, { signal: controller.signal }).then(response => response.ok ? response.json() : []).catch(() => []);
        if (controller.signal.aborted) return;
        setIndex(previous => ({ ...previous, [kind]: knownEntries }));
        const values = await client.list(kind, { knownEntries, signal: controller.signal });
        if (!controller.signal.aborted) setFiles(values);
        const stored = await draftStore('getAll');
        for (const cached of stored.filter(item => item.kind === kind && !item.trashedAt && !item.baseline && hasDraftContent(item))) {
          if (controller.signal.aborted) break;
          const remote = values.find(file => file.path === cached.path);
          if (!remote || (operation.current && current.current.entry?.path === cached.path)) continue;
          try {
            const sha = await gitBlobSha(entryText(cached, cached.data.draft === true));
            if (sha !== remote.sha) continue;
            const baseline = draftFingerprint(cached);
            const active = current.current.entry?.path === cached.path;
            const reconciled = active ? { ...current.current.entry, sha, baseline } : { ...cached, sha, baseline };
            if (operation.current && active) continue;
            if (active) { current.current = { ...current.current, entry: reconciled }; setEntry(reconciled); }
            await storeValue({ entry: reconciled, assets: active ? current.current.assets : cached.assets || [], imports: active ? current.current.imports : cached.imports || [] }, true);
          } catch { /* Unmatched or incomplete drafts remain available for manual review. */ }
        }
      })().catch(error => !controller.signal.aborted && setMessage(error.message)).finally(() => setLoading(false));
    }
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, client, ready, reloadList]);
  const changeKind = async value => {
    if (busy || value === kind) return;
    setBusy(true);
    try {
      await storeCurrent();
      const values = await draftStore('getAll');
      const draft = values.filter(item => item.kind === value && !item.trashedAt && !['published', 'empty'].includes(localDraftStatus(item))).sort((a, b) => b.updated - a.updated)[0];
      setKind(value); location.hash = value; setMessage(''); setCommitUrl(''); setPublishResult(null); setPreview(false); setFiles([]); setFocusPoint(null);
      activate(draft || (value === 'site' ? null : newEntry(value)));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const update = (key, value) => setEntry(previous => ({ ...previous, data: { ...previous.data, [key]: value } }));
  const copyCurrent = async (value = current.current) => {
    if (!hasDraftContent(value.entry, value.assets)) { setMessage('请先填写内容，再另存为新草稿。'); return null; }
    await storeCurrent();
    const freshValue = newEntry(value.entry.kind);
    const copy = { ...value.entry, id: freshValue.id, path: freshValue.path, sha: null, baseline: undefined, pendingPublication: undefined, trashedAt: undefined, data: { ...value.entry.data, title: `${value.entry.data.title || '未命名草稿'}（副本）`, slug: freshValue.data.slug, draft: true } };
    const saved = await storeValue({ entry: copy, assets: value.assets, imports: value.imports }, true);
    return saved;
  };
  const saveCopy = async () => { if (busy) return; setBusy(true); try { const copy = await copyCurrent(); if (copy) { activate(copy); setMessage('已另存为一份独立草稿，原稿仍保留在列表中。'); setCommitUrl(''); setPublishResult(null); } } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const load = async (path, preserveLocal = false) => {
    if (busy) return; setBusy(true); setMessage('');
    try {
      await storeCurrent();
      if (preserveLocal) { const cached = await draftStore('get', path); if (cached && ['local', 'unverified'].includes(localDraftStatus(cached))) await copyCurrent({ entry: cached, assets: cached.assets || [], imports: cached.imports || [] }); }
      const file = await client.read(path), parsed = readRecord(file.text);
      const value = { kind, path, sha: file.sha, data: parsed.data, body: parsed.body };
      let importedImages = [];
      if (parsed.data.sourceDocument) { const attachment = await client.attachment(parsed.data.sourceDocument), imported = await importPreview(attachment.blob, attachment.name); value.body = imported.body; importedImages = imported.images; }
      value.baseline = draftFingerprint(value);
      activate(value, [], importedImages); setPreview(false); setFocusPoint(null); setPublishResult(null); setCommitUrl('');
      if (preserveLocal) setMessage('已载入 GitHub 版本。本地修改保留在独立副本中，可从本地草稿继续编辑。');
      else if (parsed.data.sourceDocument) setMessage('正文来自 Typora 文件。重新上传可替换；要在线编辑请先清除导入文件。');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const restore = async path => {
    if (busy) return; setBusy(true);
    try { await storeCurrent(); const draft = await draftStore('get', path); if (draft && !draft.trashedAt) { activate(draft); setMessage(`已打开草稿：${draft.data.title || '未命名草稿'}`); setPublishResult(null); setCommitUrl(''); setPreview(false); } }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const fresh = async () => { if (busy) return; setBusy(true); try { await storeCurrent(); activate(newEntry(kind)); setPreview(false); setMessage('已新建独立内容，填入文字或图片后会保存为新草稿。'); setFocusPoint(null); setPublishResult(null); setCommitUrl(''); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const trashDraft = async draft => {
    if (busy) return; setBusy(true); trashed.current.add(draft.path);
    try {
      await persistDraft({ ...draft, trashedAt: Date.now() });
      if (current.current.entry?.path === draft.path) activate(newEntry(kind));
      setLocalDrafts(await draftStore('getAll')); setMessage('这份本地草稿已移入回收站，可以恢复；GitHub 内容未删除。');
    } catch (error) { trashed.current.delete(draft.path); setMessage(error.message); } finally { setBusy(false); }
  };
  const recoverDraft = async draft => {
    if (busy) return; setBusy(true);
    try { const restored = { ...draft, trashedAt: undefined, trashReason: undefined, keepEmpty: !hasDraftContent(draft), updated: Date.now() }; await persistDraft(restored); trashed.current.delete(draft.path); setLocalDrafts(await draftStore('getAll')); setMessage('草稿已恢复。'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const connect = async event => {
    event.preventDefault(); setBusy(true); setConnectionError('');
    try { const next = githubContent(token); await next.connect(); setClient(next); setConnected(true); setConnection(false); setToken(''); const intent = pendingIntent.current; pendingIntent.current = null; setMessage('GitHub 已连接。'); if (intent !== null) setTimeout(() => void publish(intent, next), 0); }
    catch (error) { setConnectionError(error.message); } finally { setBusy(false); }
  };
  const upload = async filesToAdd => { setBusy(true); setMessage(''); try { const added = []; for (const file of filesToAdd) added.push(await imageAsset(file, kind)); setAssets(previous => [...previous, ...added]); const images = added.map(asset => ({ src: `/${asset.path}`, caption: '' })); setEntry(previous => ({ ...previous, data: { ...previous.data, images: [...(previous.data.images || []), ...images], cover: previous.data.cover || images[0]?.src } })); } catch (error) { setMessage(error.message); } finally { setBusy(false); if (uploadInput.current) uploadInput.current.value = ''; } };
  const importDocument = async file => { if (!file) return; setBusy(true); try { const imported = await importPreview(file, file.name), extension = file.name.split('.').at(-1).toLowerCase(), path = `content/documents/${crypto.randomUUID()}.${extension}`; setAssets(previous => [...previous.filter(asset => asset.path !== entry.data.sourceDocument?.replace(/^\//, '')), { path, blob: file, name: file.name, uploaded: false }]); setImports(imported.images.map(image => ({ ...image, path: image.path }))); setEntry(previous => ({ ...previous, body: imported.body, data: { ...previous.data, sourceDocument: `/${path}` } })); setMessage('文档已读取，标题和日期仍以表单填写为准。'); } catch (error) { setMessage(error.message); } finally { setBusy(false); if (importInput.current) importInput.current.value = ''; } };
  const photos = (entry?.data.images || []).map(image => typeof image === 'string' ? { src: image, caption: '' } : image);
  const alterPhoto = (position, value) => update('images', photos.map((image, n) => n === position ? { ...image, ...value } : image));
  const removePhoto = position => { const next = photos.filter((_, n) => n !== position); update('images', next); if (entry.data.cover === photos[position].src) update('cover', next[0]?.src || ''); };
  const movePhoto = (position, delta) => { const next = [...photos]; [next[position], next[position + delta]] = [next[position + delta], next[position]]; update('images', next); };
  const insert = (before, after = '') => { const input = bodyInput.current, start = input?.selectionStart ?? entry.body.length, end = input?.selectionEnd ?? start; setEntry(previous => ({ ...previous, body: previous.body.slice(0, start) + before + previous.body.slice(start, end) + after + previous.body.slice(end) })); requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, end + before.length); }); };
  const snapshotText = (draft = true) => entryText(entry, draft);
  const publish = async (draft, suppliedClient) => {
    if (operation.current || !current.current.entry) return;
    const { entry, assets, imports } = current.current, kind = entry.kind;
    let text;
    try { text = entryText(entry, draft); } catch (error) { setMessage(error.message); setPublishResult({ error: true, label: error.message }); return; }
    if (!connected && !suppliedClient) { pendingIntent.current = draft; setConnection(true); return; }
    const op = { controller: new AbortController(), snapshot: { entry: { ...entry, data: { ...entry.data, ...(kind !== 'site' ? { draft } : {}) } }, assets: assets.map(asset => ({ ...asset })), imports } };
    operation.current = op;
    setBusy(true); setCommitUrl(''); setPublishResult(null); setMessage(''); setPublication({ label: '正在保存发布前的本地草稿…', step: 0, total: 5 });
    let localWarning = '';
    try {
      const targetSha = await gitBlobSha(text);
      const previousAttempt = entry.pendingPublication;
      op.snapshot.entry.pendingPublication = { targetSha, started: Date.now() };
      activate(op.snapshot.entry, op.snapshot.assets, imports);
      try { await storeValue(op.snapshot, true); } catch (error) { localWarning = error.message; }
      const references = JSON.stringify(op.snapshot.entry.data) + op.snapshot.entry.body;
      const attached = op.snapshot.assets.filter(asset => !asset.uploaded && references.includes(asset.path));
      const result = await (suppliedClient || client).publish({ path: entry.path, sha: entry.sha, text, assets: attached, previousAttempt, signal: op.controller.signal,
        onProgress: progress => { if (operation.current === op) setPublication(progress); },
        onAssetUploaded: value => {
          op.snapshot.assets = op.snapshot.assets.map(asset => asset.path === value.path ? { ...asset, remoteSha: value.remoteSha } : asset);
          if (operation.current === op) { current.current = op.snapshot; setAssets(op.snapshot.assets); }
          void storeValue({ ...op.snapshot, assets: [...op.snapshot.assets] }, true).catch(error => { localWarning = error.message; });
        },
      });
      const synced = { ...op.snapshot.entry, sha: result.sha, pendingPublication: undefined };
      synced.baseline = draftFingerprint(synced);
      const finalAssets = op.snapshot.assets.map(asset => attached.some(item => item.path === asset.path) ? { ...asset, uploaded: true } : asset);
      activate(synced, finalAssets, imports);
      try { await storeValue({ entry: synced, assets: finalAssets, imports }, true); } catch (error) { localWarning = error.message; }
      const label = draft && kind !== 'site' ? 'GitHub 已确认保存这份草稿，网页暂不展示。' : 'GitHub 已确认提交，网站正在自动更新。';
      setMessage(label + (result.recovered ? ' 已核对上次结果，没有重复提交。' : '') + (localWarning ? ' 本地保存遇到问题，可下载备份；GitHub 中的内容已经保存。' : ''));
      setPublishResult({ error: false, label }); setCommitUrl(result.url);
      setFiles(previous => [{ path: synced.path, name: synced.path.split('/').at(-1), sha: result.sha, title: synced.data.title, state: draft ? 'github-draft' : 'published' }, ...previous.filter(file => file.path !== synced.path)]);
    } catch (error) {
      setMessage(error.message); setPublishResult({ error: true, label: error.message, conflict: error.code === 'CONFLICT' });
    } finally { if (operation.current === op) { operation.current = null; setBusy(false); setPublication(null); } }
  };
  const download = () => { try { const text = kind === 'site' ? JSON.stringify(entry.data, null, 2) : snapshotText(true), url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = entry.path.split('/').at(-1); link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); setMessage('已下载正文和字段；尚未上传的配图仍保留在浏览器草稿中。'); } catch (error) { setMessage(error.message); } };
  const normalized = useMemo(() => { try { return entry && kind === 'records' ? normalizeRecord(entry.data) : null; } catch { return null; } }, [entry, kind]);
  const resolveBodyImage = useCallback(src => {
    let decoded; try { decoded = decodeURIComponent(src); } catch { return src; }
    const clean = value => value.replace(/^\.\//, '').replace(/^\//, '');
    const local = urls.find(item => clean(item.path) === clean(decoded));
    if (local) return local.url;
    if (/^https?:|^\/\//i.test(src)) return src;
    if (decoded.startsWith('/content/')) return sourceImageUrl(decoded);
    try { return new URL(decoded, sourceImageUrl('/' + entry.path)).href; } catch { return src; }
  }, [urls, entry?.path]);
  return <ThemeProvider><div className="content-editor-shell"><aside className="content-editor-nav"><a className="wordmark" href="/">Haotlas</a><p>Content</p><nav aria-label="内容栏目">{Object.entries(names).map(([key, label]) => <button type="button" key={key} aria-current={kind === key ? 'page' : undefined} disabled={busy} onClick={() => changeKind(key)}>{label}</button>)}</nav><div className="editor-nav-bottom"><button type="button" onClick={() => setConnection(true)}>{connected ? 'GitHub 已连接' : '连接 GitHub'}</button><a href="https://app.pagescms.org/Li-yao114/haotlas.com/main" target="_blank" rel="noreferrer">原 Pages CMS</a><a href="/" target="_blank" rel="noreferrer">查看网站</a><ThemeToggle /></div></aside>
    <main className="content-editor-main"><header className="editor-top"><div><span>内容管理</span><h1>{names[kind]}</h1></div><div>{kind !== 'site' && <button type="button" disabled={busy} onClick={fresh}>新建{kind === 'records' ? '记录' : kind === 'writing' ? '文稿' : '手记'}</button>}<button type="button" disabled={!entry || busy || kind === 'site'} onClick={saveCopy}>另存为新草稿</button><button type="button" disabled={!entry || busy} onClick={download}>下载备份</button><button className="editor-top-publish" type="button" disabled={!entry || busy} onClick={() => publish(false)}>{kind === 'site' ? '保存' : '发布'}</button></div></header>
    {message && <div className="editor-message" role="status">{message}{commitUrl && <a href={commitUrl} target="_blank" rel="noreferrer">查看本次提交</a>}</div>}
    {publication && <div className="publication-progress" role="status"><div><strong>{publication.label}</strong><span>已等待 {elapsed} 秒</span></div><progress max={publication.total} value={publication.step} aria-label="发布进度" /><button type="button" onClick={() => operation.current?.controller.abort()}>停止等待</button></div>}
    {kind !== 'site' && <DraftLibrary kind={kind} files={files} drafts={localDrafts} currentPath={entry?.path} busy={busy} loading={loading} onOpen={item => item.local && (!item.remote || ['local', 'unverified'].includes(item.status) || item.local.sha === item.remote.sha) ? restore(item.path) : load(item.path)} onRemote={path => load(path, true)} onTrash={trashDraft} onRecover={recoverDraft} onRefresh={() => setReloadList(value => value + 1)} />}
    {!entry ? <p className="editor-waiting">正在读取文案…</p> : <><fieldset className="editor-form" disabled={busy} inert={busy}>{kind === 'site' ? <SiteFields entry={entry} onChange={data => setEntry(previous => ({ ...previous, data }))} /> : <>
      <div className="editor-basic"><Field label="标题"><input required value={entry.data.title || ''} onChange={event => update('title', event.target.value)} placeholder={kind === 'records' ? '为这次经历起个名字' : '文章标题'} /></Field><Field label={kind === 'records' ? '到访或发生日期' : '日期'}><input type="date" required value={String(entry.data.date || '').slice(0, 10)} onChange={event => update('date', event.target.value)} /></Field>{kind === 'records' && <Field label="记录类型"><select value={entry.data.category || 'food'} onChange={event => update('category', event.target.value)}><option value="food">美食</option><option value="place">地点</option><option value="event">事件</option></select></Field>}<Field label={kind === 'records' ? '一句话记忆' : '摘要'} wide><textarea value={entry.data.summary || ''} onChange={event => update('summary', event.target.value)} placeholder="可选，留空时从正文生成" rows={2} /></Field></div>
      {kind === 'records' && <section className="editor-panel"><div className="editor-panel-heading"><div><h2>{entry.data.category === 'food' ? '这次吃得怎么样？' : '这次的体验'}</h2><p>{entry.data.category === 'food' ? '在星星上点击或滑动，支持半星。三项评完后自动生成总评。' : '点击或滑动星星，记录自己的感受。'}</p></div><div className="editor-score"><span>综合评价</span><StarRating value={normalized?.rating} /></div></div>{entry.data.category === 'food' ? FOOD_CRITERIA.map(item => <StarSlider key={item.key} label={item.name} weight={item.weight} value={entry.data.foodRating?.[item.key] ?? null} onChange={value => update('foodRating', { ...entry.data.foodRating, [item.key]: value })} />) : <StarSlider label="我的总评" value={Number(entry.data.rating) || null} onChange={value => update('rating', value)} />}<p className="editor-help">{entry.data.category === 'food' ? '口味 60% · 服务态度 20% · 环境 20%，加权后四舍五入到半星；缺项不会按零分计算。' : '个人评分，满分 5 星，可暂不评分。'}</p></section>}
      <section className="editor-panel"><h2>{kind === 'photography' ? '照片' : '图文记录'}</h2><div className="editor-upload" onDragOver={event => { event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (!busy) upload([...event.dataTransfer.files]); }}><input ref={uploadInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={event => upload([...event.target.files])} aria-label="添加图片" /><span>点击选择或拖入照片</span><small>{kind === 'photography' ? '保留照片原文件，网站自动读取拍摄信息。' : '大图会自动优化，保留完整画幅。'}</small></div>{!!photos.length && <div className="editor-images">{photos.map((image, n) => <ImageTile key={`${image.src}-${n}`} image={image} index={n} count={photos.length} url={imageUrl(image.src)} cover={(entry.data.cover || photos[0]?.src) === image.src} onCaption={value => alterPhoto(n, { caption: value })} onCover={() => update('cover', image.src)} onRemove={() => removePhoto(n)} onMove={delta => movePhoto(n, delta)} onInsert={kind === 'photography' || entry.data.sourceDocument ? null : () => insert(`\n![${image.caption || ''}](${image.src})\n`)} />)}</div>}
      {kind !== 'photography' && <div className="editor-import"><label>Typora 文稿<input ref={importInput} type="file" accept=".md,.markdown,.zip" aria-label="导入 Typora 文稿" onChange={event => importDocument(event.target.files[0])} /></label>{entry.data.sourceDocument && <div><span>已使用导入文件，正文以文件为准。</span><button type="button" onClick={() => { update('sourceDocument', ''); setImports([]); }}>改为在线编辑</button></div>}<p>支持 Markdown；带本地图片时，将一篇文稿和图片文件夹一起打成 ZIP。</p></div>}
      <div className="editor-body-heading"><h3>{kind === 'photography' ? '照片之外' : '正文'}</h3><div><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>编辑</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>预览</button></div></div>{preview ? <div className="editor-markdown-preview article-body"><MarkdownContent resolveImage={resolveBodyImage}>{entry.body || '还没有正文。'}</MarkdownContent></div> : <><div className="editor-toolbar"><button type="button" disabled={!!entry.data.sourceDocument} onClick={() => insert('**', '**')}>粗体</button><button type="button" disabled={!!entry.data.sourceDocument} onClick={() => insert('\n## ')}>标题</button><button type="button" disabled={!!entry.data.sourceDocument} onClick={() => insert('\n- ')}>列表</button><button type="button" disabled={!!entry.data.sourceDocument} onClick={() => insert('[', '](https://)')}>链接</button><button type="button" disabled={!!entry.data.sourceDocument} onClick={() => insert('\n```\n', '\n```\n')}>代码</button></div><textarea ref={bodyInput} className="editor-body-input" aria-label="Markdown 正文" readOnly={!!entry.data.sourceDocument} value={entry.body} placeholder="写下当时的感受，支持 Markdown…" onChange={event => setEntry(previous => ({ ...previous, body: event.target.value }))} /><p className="editor-help">{entry.body.trim().length} 字符 · 支持 Markdown、表格和代码块</p></>}
      </section>
      {kind === 'records' && <section className="editor-panel"><h2>把地点留下来</h2><PlaceSearch onSelect={place => { setEntry(previous => ({ ...previous, data: { ...previous.data, title: previous.data.title || place.name, placeName: place.name, city: place.city, address: place.address, mapPoint: `${place.point.lng},${place.point.lat}` } })); setFocusPoint(place.point); }} /><RecordsMap items={EMPTY} picker pickedPoint={normalized?.point} focusPoint={focusPoint} onPointPick={point => update('mapPoint', `${point.lng},${point.lat}`)} /><p className="editor-help">点击地图可微调位置，手机使用双指移动。发布前请核对实际门店。</p><div className="editor-basic"><Field label="店铺或地点名称"><input value={entry.data.placeName || ''} onChange={event => update('placeName', event.target.value)} /></Field><Field label="城市"><input value={entry.data.city || ''} onChange={event => update('city', event.target.value)} /></Field><Field label="详细地址" wide><textarea rows={2} value={entry.data.address || ''} onChange={event => update('address', event.target.value)} /></Field><Field label="坐标（经度,纬度）" hint="选点后自动填写，也可以清空，不展示地图。"><input value={entry.data.mapPoint || ''} onChange={event => update('mapPoint', event.target.value)} /></Field><Field label="地图导航链接（可选）"><input type="url" value={entry.data.navigationUrl || ''} onChange={event => update('navigationUrl', event.target.value)} placeholder="高德、腾讯等地图的分享链接" /></Field></div></section>}
      <details className="editor-panel editor-more"><summary>更多信息</summary><div className="editor-basic">{kind === 'records' && <><Field label={entry.data.category === 'food' ? '人均消费（元）' : '本次花费（元）'}><input type="number" min="0" value={entry.data.cost ?? ''} onChange={event => update('cost', event.target.value)} /></Field><Field label="推荐与亮点" wide><textarea value={entry.data.recommended || ''} onChange={event => update('recommended', event.target.value)} placeholder="推荐菜、值得停留的角落或印象深刻的时刻" /></Field></>}<Field label="标签" hint="多个标签用逗号分隔。"><input value={entry.tagsText ?? (entry.data.tags || []).join(', ')} onChange={event => { const value = event.target.value; setEntry(previous => ({ ...previous, tagsText: value, data: { ...previous.data, tags: value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean) } })); }} /></Field><Field label="内容地址" hint="已有内容建议保持原值，避免链接变化。"><input value={entry.data.slug || ''} onChange={event => update('slug', event.target.value)} /></Field></div></details>
      {normalized && <details className="editor-panel editor-public-preview"><summary>网站位置卡片与评分预览</summary><StarRating value={normalized.rating} /><RecordLocation record={{ ...normalized, title: entry.data.title, slug: entry.data.slug }} /></details>}
    </>}</fieldset><footer className="editor-save-bar">{(publication || publishResult) && <div className="publish-footer-feedback" role="status"><span>{publication ? `${publication.label} · ${elapsed} 秒` : publishResult.label}</span>{publication && <button type="button" onClick={() => operation.current?.controller.abort()}>停止等待</button>}{publishResult?.conflict && <button type="button" onClick={() => load(entry.path, true)}>核对 GitHub 版本</button>}</div>}<div><span role="status">{saveState}</span><small>公开仓库中的草稿源文件也可被查看。</small></div><div><button type="button" disabled={busy || !entry} onClick={saveLocal}>保存本地草稿</button>{kind !== 'site' && <button type="button" disabled={busy} onClick={() => publish(true)}>同步草稿到 GitHub</button>}<button className="editor-publish" type="button" disabled={busy} onClick={() => publish(false)}>{busy ? '正在处理…' : kind === 'site' ? '保存网站文案' : '发布到网站'}</button></div></footer></>}
    </main></div>{connection && <Modal label="连接 GitHub" onClose={() => { if (!busy) { setConnection(false); setToken(''); pendingIntent.current = null; } }}><form className="editor-connect" onSubmit={connect}><h2>连接你的 GitHub</h2><p>为 haotlas.com 创建仅授权此仓库的 Fine-grained Token，将 Repository permissions 中的 Contents 设为 Read and write。</p><a href="https://github.com/settings/personal-access-tokens/new?name=Haotlas%20Content&amp;target_name=Li-yao114&amp;contents=write&amp;expires_in=90" target="_blank" rel="noreferrer">在 GitHub 创建连接令牌</a>{connectionError && <p className="editor-connection-error" role="alert">{connectionError}</p>}<label>连接令牌<input autoFocus required type="password" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)} /></label><p>令牌只保留在当前页面内存中，刷新后需重新连接；不会写入草稿、仓库或其他服务器。</p><div><button type="button" disabled={busy} onClick={() => { setConnection(false); setToken(''); pendingIntent.current = null; }}>取消</button><button type="submit" disabled={busy || !token.trim()}>{busy ? '连接中…' : '连接'}</button>{connected && <button type="button" disabled={busy} onClick={() => { setClient(githubContent()); setConnected(false); setConnection(false); setToken(''); }}>断开连接</button>}</div></form></Modal>}</ThemeProvider>;
}
const SITE_LABELS = { home: '首页', pages: '栏目标题与简介', about: '关于页', footer: '页脚', title: '主标题', description: '简介', profileName: '个人名称', profileBio: '个人简介', artworkCaption: '插画说明', photographyIntro: '摄影入口简介', recordsIntro: '记录入口简介', writingTitle: '文稿标题', writingDescription: '文稿简介', photographyTitle: '摄影标题', photographyDescription: '摄影简介', recordsTitle: '记录标题', recordsDescription: '记录简介', body: '关于正文（Markdown）', copyright: '页脚署名' };
function SiteFields({ entry, onChange }) { return <>{Object.entries(entry.data).map(([section, fields]) => <section key={section} className="editor-panel"><h2>{SITE_LABELS[section] || section}</h2><div className="editor-basic">{Object.entries(fields).map(([key, value]) => <Field key={key} wide={['body', 'profileBio', 'description'].includes(key)} label={SITE_LABELS[key] || key}>{['body', 'profileBio', 'description', 'photographyIntro', 'recordsIntro'].includes(key) ? <textarea rows={key === 'body' ? 7 : 3} value={value} onChange={event => onChange({ ...entry.data, [section]: { ...fields, [key]: event.target.value } })} /> : <input value={value} onChange={event => onChange({ ...entry.data, [section]: { ...fields, [key]: event.target.value } })} />}</Field>)}</div></section>)}</>; }
createRoot(document.getElementById('root')).render(<ContentApp />);
