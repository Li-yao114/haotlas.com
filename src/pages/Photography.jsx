import React from 'react';
import AlbumList from '../components/AlbumList';
import PhotoStage from '../components/PhotoStage';
import MarkdownContent from '../components/MarkdownContent';
import ContentState from '../components/ContentState';
import Icon from '../components/Icon';
import useMarkdown from '../hooks/useMarkdown';
import { hrefFor, displayDate } from '../lib/navigation';

function PhotoEssay({ album, albums, initialBody }) {
  const { body, loading, error } = useMarkdown(album.file, initialBody);
  const otherAlbums = albums.filter(item => item.slug !== album.slug);
  const dates = [...new Set(album.images.map(image => image.takenAt?.slice(0, 10)).filter(Boolean))].sort();
  const taken = dates.length ? dates.length === 1 ? displayDate(dates[0]) : `${displayDate(dates[0])} — ${displayDate(dates.at(-1))}` : null;
  return <article className="photo-essay"><a className="reading-back" href={hrefFor('photography')}><Icon name="left" />全部摄影手记</a><header className="essay-header"><div><h1>{album.title}</h1>{album.summary && <p>{album.summary}</p>}</div><div className="essay-meta"><span>记录于 <time dateTime={album.date.slice(0, 10)}>{displayDate(album.date)}</time></span>{taken && <span>拍摄于 {taken}</span>}<span>{album.images.length} 张照片</span></div></header><PhotoStage key={album.slug} album={album} />
    {(loading || error || body.trim()) && <section className="photo-reflections section-divider" aria-labelledby="reflections-title"><h2 id="reflections-title">照片之外</h2><div>{loading ? <p className="muted" role="status">正在加载手记…</p> : error ? <p role="alert">手记暂时无法加载，请刷新后重试。</p> : <div className="article-body"><MarkdownContent>{body}</MarkdownContent></div>}</div></section>}
    {!!otherAlbums.length && <section className="more-albums section-divider"><div className="section-heading"><h2>其他摄影手记</h2><a className="text-link" href={hrefFor('photography')}>查看全部</a></div><AlbumList albums={otherAlbums.slice(0, 2)} /></section>}
  </article>;
}

export default function Photography({ albums, selectedSlug, initialBody }) {
  if (selectedSlug) {
    const album = albums.find(item => item.slug === selectedSlug);
    return album ? <PhotoEssay key={album.slug} album={album} albums={albums} initialBody={initialBody} /> : <ContentState title="这篇摄影手记暂未收录" back="photography" backLabel="查看全部摄影手记" />;
  }
  const total = albums.reduce((count, album) => count + album.images.length, 0);
  return <><header className="page-title"><div><h1>摄影</h1><p>看见的风景，和当时的想法。</p></div><span className="count">{albums.length} 篇手记 / {total} 张照片</span></header>{albums.length ? <AlbumList albums={albums} /> : <ContentState title="影像慢慢积累" >新的摄影手记会出现在这里。</ContentState>}</>;
}
