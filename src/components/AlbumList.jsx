import React from 'react';
import { hrefFor, displayDate } from '../lib/navigation';

export default function AlbumList({ albums }) {
  return <div className="album-list">{albums.map(album => {
    const cover = album.images.find(image => image.src === album.cover) || album.images[0];
    const href = hrefFor('photography', album.slug);
    return <article className="album-entry" key={album.slug}>
      <a className="album-cover" href={href} aria-label={`查看摄影手记：${album.title}`}><img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 540px) calc(100vw - 68px), (max-width: 900px) 80vw, 720px" width={cover.width} height={cover.height} loading="lazy" decoding="async" alt={cover.caption || album.title} /></a>
      <div className="album-copy"><div className="album-title-row"><h2><a href={href}>{album.title}</a></h2><span>{album.images.length} 张照片</span></div>{album.summary && <p>{album.summary}</p>}<div className="album-footer"><time dateTime={album.date.slice(0, 10)}>{displayDate(album.date)}</time><a className="album-open" href={href}>查看手记</a></div></div>
    </article>;
  })}</div>;
}
