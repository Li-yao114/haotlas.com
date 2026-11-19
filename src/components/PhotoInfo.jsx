import React from 'react';

export function photoInfoText(image) {
  return [image.camera, image.lens, image.focalLength, image.aperture, image.shutter, image.iso != null ? `ISO ${image.iso}` : ''].filter(Boolean).join(' / ');
}

export default function PhotoInfo({ image }) {
  const info = photoInfoText(image);
  return <div className="photo-info">{info && <p>{info}</p>}{image.caption && <p className="photo-caption-text">{image.caption}</p>}{Number.isFinite(image.lat) && Number.isFinite(image.lng) && <p>拍摄位置 {image.lat.toFixed(3)}, {image.lng.toFixed(3)}</p>}</div>;
}
