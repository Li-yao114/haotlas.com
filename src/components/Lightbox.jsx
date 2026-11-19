import React, { useRef } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { photoInfoText } from './PhotoInfo';

export default function Lightbox({ album, index, onChange, onClose }) {
  const image = album.images[index];
  const start = useRef(null);
  const move = delta => onChange((index + delta + album.images.length) % album.images.length);
  return <Modal className="lightbox" label={`${album.title}，照片预览`} onClose={onClose}>
    <div className="lightbox-content" onKeyDown={event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    }}>
      <div className="lightbox-head"><span>{album.title}</span><button type="button" onClick={onClose} autoFocus aria-label="关闭照片预览"><Icon name="close" /><span>关闭</span></button></div>
      <div className="lightbox-stage" onTouchStart={event => { const t = event.changedTouches[0]; start.current = { x: t.clientX, y: t.clientY }; }} onTouchEnd={event => {
        if (!start.current) return;
        const t = event.changedTouches[0], dx = t.clientX - start.current.x, dy = t.clientY - start.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        start.current = null;
      }}><img key={image.full} src={image.full || image.src} alt={image.caption || `${album.title}，第 ${index + 1} 张照片`} decoding="async" /></div>
      {album.images.length > 1 && <><button type="button" className="lightbox-arrow prev" aria-label="上一张照片" onClick={() => move(-1)}><Icon name="left" /></button><button type="button" className="lightbox-arrow next" aria-label="下一张照片" onClick={() => move(1)}><Icon name="right" /></button></>}
      <div className="lightbox-caption"><div><h2>{image.caption || album.title}</h2><p>{photoInfoText(image)}</p>{image.takenAt && <p>拍摄于 {image.takenAt}{image.utcOffset ? ` ${image.utcOffset}` : ''}</p>}</div><span className="lightbox-counter" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(album.images.length).padStart(2, '0')}</span></div>
    </div>
  </Modal>;
}
