import React, { lazy, Suspense, useState } from 'react';
import Icon from './Icon';
import PhotoInfo from './PhotoInfo';

const Lightbox = lazy(() => import('./Lightbox'));

export default function PhotoStage({ album }) {
  const [index, setIndex] = useState(() => Math.max(0, album.images.findIndex(image => image.src === album.cover)));
  const [open, setOpen] = useState(false);
  const image = album.images[index] || album.images[0];
  const portrait = image.height > image.width;
  const move = delta => setIndex(current => (current + delta + album.images.length) % album.images.length);
  return <section className="photo-viewer" aria-label={`${album.title}，照片浏览`}>
    <button type="button" className="hero-photo" aria-label="放大查看当前照片" onClick={() => setOpen(true)}>
      <img key={image.src} src={image.src} srcSet={image.srcSet} sizes={portrait ? '(max-width: 540px) calc(100vw - 36px), 600px' : '(max-width: 1184px) 94vw, 1120px'} width={image.width} height={image.height} alt={image.caption || `${album.title}，第 ${index + 1} 张照片`} decoding="async" fetchPriority="high" />
      <span className="photo-affordance"><Icon name="expand" /></span>
    </button>
    <div className="hero-caption"><PhotoInfo image={image} /><div className="photo-side"><span className="photo-numbers" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(album.images.length).padStart(2, '0')}</span>{album.images.length > 1 && <div className="photo-nav"><button type="button" aria-label="上一张照片" onClick={() => move(-1)}><Icon name="left" /></button><button type="button" aria-label="下一张照片" onClick={() => move(1)}><Icon name="right" /></button></div>}</div></div>
    {album.images.length > 1 && <div className="photo-thumbnails" aria-label="选择照片">{album.images.map((photo, n) => <button type="button" key={photo.src} aria-label={`查看第 ${n + 1} 张照片`} aria-pressed={index === n} onClick={() => setIndex(n)}><img src={photo.thumb || photo.src} alt="" width={72} height={72} loading="lazy" decoding="async" /></button>)}</div>}
    {open && <Suspense fallback={null}><Lightbox album={album} index={index} onChange={setIndex} onClose={() => setOpen(false)} /></Suspense>}
  </section>;
}
