import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { stringify } from 'yaml';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import ThemeToggle from '../components/theme/ThemeToggle';
import Modal from '../components/Modal';
import MarkdownContent from '../components/MarkdownContent';
import StarRating from '../components/StarRating';
import RecordsMap from '../components/RecordsMap';
import RecordLocation from '../components/RecordLocation';
import { FOOD_CRITERIA, normalizeRecord } from '../lib/records';
import { readRecord, writeRecord, newRecord, sourceImageUrl } from './record-document';
import { githubContent } from './github-content';
import { draftStore } from './drafts';
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
  const [files, setFiles] = useState([]), [localDrafts, setLocalDrafts] = useState([]), [index, setIndex] = useState({}), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [message, setMessage] = useState(''), [saveState, setSaveState] = useState(''), [preview, setPreview] = useState(false), [focusPoint, setFocusPoint] = useState(null), [ready, setReady] = useState(false), [commitUrl, setCommitUrl] = useState('');
  const bodyInput = useRef(null), uploadInput = useRef(null), importInput = useRef(null), current = useRef(null);
  current.current = { entry, assets, imports };
  const urls = useMemo(() => [...assets, ...imports].map(asset => ({ path: asset.path, url: URL.createObjectURL(asset.blob) })), [assets, imports]);
  useEffect(() => () => urls.forEach(item => URL.revokeObjectURL(item.url)), [urls]);
  const imageUrl = useCallback(path => {
    const local = urls.find(item => item.path === path.replace(/^\//, '')); if (local) return local.url;
    const collection = index[kind] || [], photo = collection.flatMap(item => item.images || []).find(image => image.source === path.split('/').at(-1));
    return photo?.thumb || sourceImageUrl(path);
  }, [urls, index, kind]);
  const storeCurrent = useCallback(async () => {
    const value = current.current;
    if (!value.entry) return;
    await draftStore('put', { ...value.entry, assets: value.assets, imports: value.imports, updated: Date.now() });
    setLocalDrafts(await draftStore('getAll'));
  }, []);
  useEffect(() => {
    draftStore('getAll').then(values => { setLocalDrafts(values); const latest = values.filter(value => value.kind === defaultTab()).sort((a, b) => b.updated - a.updated)[0]; if (latest) { const { assets = [], imports = [], ...rest } = latest; setEntry(rest); setAssets(assets); setImports(imports); } else if (defaultTab() !== 'site') setEntry(newEntry(defaultTab())); setReady(true); }).catch(() => { setSaveState('此浏览器不能自动存草稿，请及时下载备份。'); setEntry(newEntry(defaultTab() === 'site' ? 'records' : defaultTab())); setReady(true); });
  }, []);
  useEffect(() => {
    if (!ready || !entry) return;
    setSaveState('正在保存浏览器草稿…');
    const timer = setTimeout(() => storeCurrent().then(() => setSaveState('浏览器草稿已保存')).catch(() => setSaveState('浏览器存储不足，请下载备份。')), 500);
    return () => clearTimeout(timer);
  }, [entry, assets, imports, ready, storeCurrent]);
  useEffect(() => {
    const save = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); storeCurrent().then(() => setSaveState('浏览器草稿已保存')).catch(() => setSaveState('保存失败，请下载备份。')); } };
    addEventListener('keydown', save); return () => removeEventListener('keydown', save);
  }, [storeCurrent]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    if (kind === 'site') {
      client.read('content/site.json').then(file => { if (active && !current.current.entry?.kind?.includes('site')) setEntry({ kind: 'site', path: file.path, sha: file.sha, data: JSON.parse(file.text), body: '' }); }).catch(error => active && setMessage(error.message));
    } else {
      setLoading(true); client.list(kind).then(values => active && setFiles(values)).catch(error => active && setMessage(error.message)).finally(() => active && setLoading(false));
      fetch(`/content/${kind}/index.json`).then(response => response.ok ? response.json() : []).then(values => active && setIndex(previous => ({ ...previous, [kind]: values }))).catch(() => {});
    }
    return () => { active = false; };
  }, [kind, client, ready]);
  const changeKind = async value => { if (busy || value === kind) return; setBusy(true); try { await storeCurrent(); } catch {} setKind(value); location.hash = value; setMessage(''); setCommitUrl(''); setPreview(false); setFiles([]); setFocusPoint(null); const draft = localDrafts.filter(item => item.kind === value).sort((a, b) => b.updated - a.updated)[0]; setEntry(draft || (value === 'site' ? null : newEntry(value))); setAssets(draft?.assets || []); setImports(draft?.imports || []); setBusy(false); };
  const update = (key, value) => setEntry(previous => ({ ...previous, data: { ...previous.data, [key]: value } }));
  const load = async path => { if (busy) return; setBusy(true); setMessage(''); try { await storeCurrent(); const file = await client.read(path), parsed = readRecord(file.text); const value = { kind, path, sha: file.sha, data: parsed.data, body: parsed.body }; let importedImages = []; if (parsed.data.sourceDocument) { const attachment = await client.attachment(parsed.data.sourceDocument), imported = await importPreview(attachment.blob, attachment.name); value.body = imported.body; importedImages = imported.images; } setEntry(value); setAssets([]); setImports(importedImages); setPreview(false); setFocusPoint(null); if (parsed.data.sourceDocument) setMessage('这篇使用 Typora 导入文件。可在下方重新上传；要在线编辑请先清除导入文件。'); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  const restore = async path => { await storeCurrent().catch(() => {}); const draft = localDrafts.find(item => item.path === path); if (draft) { setEntry(draft); setAssets(draft.assets || []); setImports(draft.imports || []); setMessage('已恢复浏览器草稿。'); } };
  const fresh = async () => { await storeCurrent().catch(() => {}); setEntry(newEntry(kind)); setAssets([]); setImports([]); setPreview(false); setMessage(''); setFocusPoint(null); };
  const connect = async event => { event.preventDefault(); setBusy(true); setConnectionError(''); try { const next = githubContent(token); await next.connect(); setClient(next); setConnected(true); setConnection(false); setToken(''); setMessage('GitHub 已连接。现在可以保存或发布。'); } catch (error) { setConnectionError(error.message); } finally { setBusy(false); } };
  const upload = async filesToAdd => { setBusy(true); setMessage(''); try { const added = []; for (const file of filesToAdd) added.push(await imageAsset(file, kind)); setAssets(previous => [...previous, ...added]); const images = added.map(asset => ({ src: `/${asset.path}`, caption: '' })); setEntry(previous => ({ ...previous, data: { ...previous.data, images: [...(previous.data.images || []), ...images], cover: previous.data.cover || images[0]?.src } })); } catch (error) { setMessage(error.message); } finally { setBusy(false); if (uploadInput.current) uploadInput.current.value = ''; } };
  const importDocument = async file => { if (!file) return; setBusy(true); try { const imported = await importPreview(file, file.name), extension = file.name.split('.').at(-1).toLowerCase(), path = `content/documents/${crypto.randomUUID()}.${extension}`; setAssets(previous => [...previous.filter(asset => asset.path !== entry.data.sourceDocument?.replace(/^\//, '')), { path, blob: file, name: file.name, uploaded: false }]); setImports(imported.images.map(image => ({ ...image, path: image.path }))); setEntry(previous => ({ ...previous, body: imported.body, data: { ...previous.data, sourceDocument: `/${path}` } })); setMessage('文档已读取，标题和日期仍以表单填写为准。'); } catch (error) { setMessage(error.message); } finally { setBusy(false); if (importInput.current) importInput.current.value = ''; } };
  const photos = (entry?.data.images || []).map(image => typeof image === 'string' ? { src: image, caption: '' } : image);
  const alterPhoto = (position, value) => update('images', photos.map((image, n) => n === position ? { ...image, ...value } : image));
  const removePhoto = position => { const next = photos.filter((_, n) => n !== position); update('images', next); if (entry.data.cover === photos[position].src) update('cover', next[0]?.src || ''); };
  const movePhoto = (position, delta) => { const next = [...photos]; [next[position], next[position + delta]] = [next[position + delta], next[position]]; update('images', next); };
  const insert = (before, after = '') => { const input = bodyInput.current, start = input?.selectionStart ?? entry.body.length, end = input?.selectionEnd ?? start; setEntry(previous => ({ ...previous, body: previous.body.slice(0, start) + before + previous.body.slice(start, end) + after + previous.body.slice(end) })); requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, end + before.length); }); };
  const snapshotText = (draft = true) => {
    if (kind === 'site') return JSON.stringify(entry.data, null, 2) + '\n';
    const data = { ...entry.data, draft };
    if (kind === 'records') return writeRecord(data, entry.body);
    if (data.slug && (/^https?:\/\//i.test(data.slug) || data.slug.split(/[\\/]/).some(part => ['.', '..'].includes(part)))) throw new Error('内容地址请填写名称，不要填写完整网址或相对路径。');
    if (!String(data.title || '').trim()) throw new Error('请填写标题。');
    if (!data.date) throw new Error('请选择日期。');
    if (!draft && kind === 'writing' && !entry.body.trim() && !data.sourceDocument) throw new Error('请先写正文或导入文稿。');
    if (!draft && kind === 'photography' && !data.images?.length) throw new Error('请至少添加一张照片。');
    return `---\n${stringify(data, { lineWidth: 0 })}---\n\n${entry.body.trim()}\n`;
  };
  const publish = async draft => {
    if (!connected) { setConnection(true); return; }
    setBusy(true); setMessage('正在检查内容并同步…'); setCommitUrl('');
    try { const text = snapshotText(draft), references = JSON.stringify(entry.data) + entry.body, attached = assets.filter(asset => !asset.uploaded && references.includes(asset.path)); const result = await client.publish({ path: entry.path, sha: entry.sha, text, assets: attached }); setEntry(previous => ({ ...previous, sha: result.sha, data: { ...previous.data, ...(kind !== 'site' ? { draft } : {}) } })); setAssets(previous => previous.map(asset => attached.includes(asset) ? { ...asset, uploaded: true } : asset)); setMessage(draft && kind !== 'site' ? '草稿已保存到 GitHub，网页暂不展示；源文件仍在公开仓库。' : '已提交到 GitHub，网站正在自动更新，通常需要几分钟。'); setCommitUrl(result.url); if (kind !== 'site') client.list(kind).then(setFiles).catch(() => {}); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
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
  const visibleFiles = files.map(file => ({ ...file, title: (index[kind] || []).find(post => `content/${post.file.replace(/^\/content\//, '')}` === file.path)?.title || file.name.replace(/\.md$/, '') }));
  return <ThemeProvider><div className="content-editor-shell"><aside className="content-editor-nav"><a className="wordmark" href="/">Haotlas</a><p>Content</p><nav aria-label="内容栏目">{Object.entries(names).map(([key, label]) => <button type="button" key={key} aria-current={kind === key ? 'page' : undefined} disabled={busy} onClick={() => changeKind(key)}>{label}</button>)}</nav><div className="editor-nav-bottom"><button type="button" onClick={() => setConnection(true)}>{connected ? 'GitHub 已连接' : '连接 GitHub'}</button><a href="https://app.pagescms.org/Li-yao114/haotlas.com/main" target="_blank" rel="noreferrer">原 Pages CMS</a><a href="/" target="_blank" rel="noreferrer">查看网站</a><ThemeToggle /></div></aside>
    <main className="content-editor-main"><header className="editor-top"><div><span>内容管理</span><h1>{names[kind]}</h1></div><div>{kind !== 'site' && <button type="button" disabled={busy} onClick={fresh}>新建{kind === 'records' ? '记录' : kind === 'writing' ? '文稿' : '手记'}</button>}<button type="button" disabled={!entry || busy} onClick={download}>下载备份</button><button className="editor-top-publish" type="button" disabled={!entry || busy} onClick={() => publish(false)}>{kind === 'site' ? '保存' : '发布'}</button></div></header>
    {message && <div className="editor-message" role="status">{message}{commitUrl && <a href={commitUrl} target="_blank" rel="noreferrer">查看本次提交</a>}</div>}
    {kind !== 'site' && <details className="editor-entries"><summary>{loading ? '正在读取内容…' : `已有内容 ${files.length} 篇 · 本地草稿 ${localDrafts.filter(item => item.kind === kind).length} 份`}</summary><div>{visibleFiles.map(file => <button type="button" disabled={busy} key={file.path} onClick={() => load(file.path)}>{file.title}<span>GitHub</span></button>)}{localDrafts.filter(item => item.kind === kind).sort((a, b) => b.updated - a.updated).map(item => <button type="button" disabled={busy} key={`local-${item.path}`} onClick={() => restore(item.path)}>{item.data.title || '未命名草稿'}<span>此浏览器</span></button>)}{!files.length && !loading && <p>还没有已同步内容，可以先写第一篇。</p>}</div></details>}
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
    </>}</fieldset><footer className="editor-save-bar"><div><span role="status">{saveState}</span><small>公开仓库中的草稿源文件也可被查看。</small></div><div>{kind !== 'site' && <button type="button" disabled={busy} onClick={() => publish(true)}>保存草稿到 GitHub</button>}<button className="editor-publish" type="button" disabled={busy} onClick={() => publish(false)}>{busy ? '正在处理…' : kind === 'site' ? '保存网站文案' : '发布到网站'}</button></div></footer></>}
    </main></div>{connection && <Modal label="连接 GitHub" onClose={() => { if (!busy) { setConnection(false); setToken(''); } }}><form className="editor-connect" onSubmit={connect}><h2>连接你的 GitHub</h2><p>为 haotlas.com 创建仅授权此仓库的 Fine-grained Token，将 Repository permissions 中的 Contents 设为 Read and write。</p><a href="https://github.com/settings/personal-access-tokens/new?name=Haotlas%20Content&amp;target_name=Li-yao114&amp;contents=write&amp;expires_in=90" target="_blank" rel="noreferrer">在 GitHub 创建连接令牌</a>{connectionError && <p className="editor-connection-error" role="alert">{connectionError}</p>}<label>连接令牌<input autoFocus required type="password" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)} /></label><p>令牌只保留在当前页面内存中，刷新后需重新连接；不会写入草稿、仓库或其他服务器。</p><div><button type="button" disabled={busy} onClick={() => { setConnection(false); setToken(''); }}>取消</button><button type="submit" disabled={busy || !token.trim()}>{busy ? '连接中…' : '连接'}</button>{connected && <button type="button" disabled={busy} onClick={() => { setClient(githubContent()); setConnected(false); setConnection(false); setToken(''); }}>断开连接</button>}</div></form></Modal>}</ThemeProvider>;
}
const SITE_LABELS = { home: '首页', pages: '栏目标题与简介', about: '关于页', footer: '页脚', title: '主标题', description: '简介', profileName: '个人名称', profileBio: '个人简介', artworkCaption: '插画说明', photographyIntro: '摄影入口简介', recordsIntro: '记录入口简介', writingTitle: '文稿标题', writingDescription: '文稿简介', photographyTitle: '摄影标题', photographyDescription: '摄影简介', recordsTitle: '记录标题', recordsDescription: '记录简介', body: '关于正文（Markdown）', copyright: '页脚署名' };
function SiteFields({ entry, onChange }) { return <>{Object.entries(entry.data).map(([section, fields]) => <section key={section} className="editor-panel"><h2>{SITE_LABELS[section] || section}</h2><div className="editor-basic">{Object.entries(fields).map(([key, value]) => <Field key={key} wide={['body', 'profileBio', 'description'].includes(key)} label={SITE_LABELS[key] || key}>{['body', 'profileBio', 'description', 'photographyIntro', 'recordsIntro'].includes(key) ? <textarea rows={key === 'body' ? 7 : 3} value={value} onChange={event => onChange({ ...entry.data, [section]: { ...fields, [key]: event.target.value } })} /> : <input value={value} onChange={event => onChange({ ...entry.data, [section]: { ...fields, [key]: event.target.value } })} />}</Field>)}</div></section>)}</>; }
createRoot(document.getElementById('root')).render(<ContentApp />);
