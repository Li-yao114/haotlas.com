import React, { useMemo, useState } from 'react';
import { site } from '../lib/site';
import { RECORD_CATEGORIES } from '../lib/records';
import { hrefFor, displayDate } from '../lib/navigation';
import RecordsMap from '../components/RecordsMap';
import RecordLocation from '../components/RecordLocation';
import StarRating from '../components/StarRating';
import PhotoStage from '../components/PhotoStage';
import MarkdownContent from '../components/MarkdownContent';
import ContentState from '../components/ContentState';
import Icon from '../components/Icon';
import useMarkdown from '../hooks/useMarkdown';

function RecordDetail({ record, records, initialBody }) {
  const { body, loading, error } = useMarkdown(record.file, initialBody);
  const next = records[records.indexOf(record) + 1];
  return <article className="record-detail"><a className="reading-back" href={hrefFor('records')}><Icon name="left" />全部记录</a><header className="record-header"><div><span className="record-category">{RECORD_CATEGORIES[record.category]}</span><h1>{record.title}</h1><p>{record.summary}</p><div className="record-byline"><time dateTime={record.date.slice(0, 10)}>{displayDate(record.date)}</time>{record.placeName && <span>{record.placeName}</span>}{record.cost != null && <span>{record.category === 'food' ? '人均' : '花费'} ¥{record.cost}</span>}</div></div><div className="record-overall"><span>我的总评</span><StarRating value={record.rating} /></div></header>
    <div className={`record-reading-layout${!loading && !body.trim() && !record.recommended && !record.images?.length ? ' metadata-only' : ''}`}><section className="record-story">{!!record.images?.length && <PhotoStage album={record} showMetadata={false} />}{loading ? <p role="status">正在加载记录…</p> : error ? <p role="alert">正文暂时无法加载，请刷新重试。</p> : body.trim() && <div className="article-body"><MarkdownContent>{body}</MarkdownContent></div>}{record.recommended && <div className="record-highlights"><h2>推荐与亮点</h2><p>{record.recommended}</p></div>}</section><aside className="record-facts">{!!record.dimensions.length && <section><h2>分项体验</h2><dl className="record-dimensions">{record.dimensions.map(dimension => <div key={dimension.name}><dt>{dimension.name}{dimension.weight && <small>{Math.round(dimension.weight * 100)}%</small>}</dt><dd><StarRating value={dimension.score} compact /></dd></div>)}</dl><p className="rating-context">{record.ratingMode === 'weighted' ? '口味 60% · 服务态度 20% · 环境 20%，综合评分四舍五入至半星。' : '总评独立填写，分项用于记录不同感受。'}</p></section>}<RecordLocation record={record} /></aside></div>
    {next && <nav className="reading-next" aria-label="继续阅读"><span className="muted">下一条记录</span><a href={hrefFor('records', next.slug)}>{next.title}<Icon name="right" /></a></nav>}
  </article>;
}
export default function Records({ records = [], selectedSlug, initialBody }) {
  const [category, setCategory] = useState('all'), [order, setOrder] = useState('date');
  const filtered = useMemo(() => records.filter(item => category === 'all' || item.category === category).sort((a, b) => order === 'rating' ? (b.rating ?? -1) - (a.rating ?? -1) || b.date.localeCompare(a.date) : b.date.localeCompare(a.date)), [records, category, order]);
  const located = useMemo(() => filtered.filter(item => item.point), [filtered]);
  if (selectedSlug) { const record = records.find(item => item.slug === selectedSlug); return record ? <RecordDetail record={record} records={records} initialBody={initialBody} /> : <ContentState title="这条记录暂未收录" back="records" backLabel="查看全部记录" />; }
  return <section className="records-index"><header className="page-title"><div><h1>{site.pages.recordsTitle}</h1><p>{site.pages.recordsDescription}</p></div><span className="count">{records.length} 条记录</span></header>
    {!!records.length && <div className="record-controls"><div className="record-filters" role="group" aria-label="筛选记录类型">{[['all', '全部'], ...Object.entries(RECORD_CATEGORIES)].map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div><label>排序<select aria-label="记录排序" value={order} onChange={event => setOrder(event.target.value)}><option value="date">最近记录</option><option value="rating">评分优先</option></select></label></div>}
    {!!located.length && <div className="record-map-overview"><div className="record-section-title"><h2>记忆的坐标</h2><span>{located.length} 条带位置的记录</span></div><RecordsMap items={located} /></div>}
    {filtered.length ? <div className="record-grid">{filtered.map(record => { const cover = record.images?.find(image => image.src === record.cover) || record.images?.[0]; return <article key={record.slug} className="record-card"><a href={hrefFor('records', record.slug)}>{cover && <div className="record-card-image"><img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 650px) 90vw, 500px" width={cover.width} height={cover.height} alt={cover.caption || record.title} loading="lazy" decoding="async" /></div>}<div className="record-card-body"><div className="record-card-meta"><span>{RECORD_CATEGORIES[record.category]}</span><time dateTime={record.date.slice(0, 10)}>{displayDate(record.date)}</time></div><h2>{record.title}</h2><p>{record.summary}</p><div className="record-card-footer"><StarRating value={record.rating} compact /><span>{record.city || record.placeName || (record.point ? '已标记位置' : '')}</span></div></div></a></article>; })}</div> : <div className="records-empty"><Icon name="location" /><h2>{records.length ? '这个分类还没有公开记录。' : '还没有公开的记录。'}</h2><p>{records.length ? '试试其他分类。' : '美食、地点和事件，会慢慢留在这里。'}</p></div>}
  </section>;
}
