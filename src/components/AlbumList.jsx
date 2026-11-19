import React from 'react';
import { hrefFor, displayDate } from '../lib/navigation';

export default function AlbumList({ albums, compact = false }) {
  return <div className={`album-list${compact ? ' album-list-compact' : ''}`}>{albums.map(album => {
    const cover = album.images.find(image => image.src === album.cover) || album.images[0];
    return <a className="album-entry" href={hrefFor('photography', album.slug)} key={album.slug}>
      <div className="album-cover"><img src={cover.src} srcSet={cover.srcSet} sizes={compact ? '(max-width: 540px) 90vw, 420px' : '(max-width: 700px) 90vw, 640px'} width={cover.width} height={cover.height} loading="lazy" decoding="async" alt={cover.caption || album.title} /></div>
      <div className="album-copy"><div className="album-meta"><time dateTime={album.date.slice(0, 10)}>{displayDate(album.date)}</time><span>{album.images.length} 张照片</span></div><h2>{album.title}</h2>{album.summary && <p>{album.summary}</p>}<span className="album-open">阅读这篇摄影手记</span></div>
    </a>;
  })}</div>;
}
