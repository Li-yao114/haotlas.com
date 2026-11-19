import path from 'node:path';

export function safePath(root, name) {
  const file = path.resolve(root, name);
  if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error(`内容路径越界：${name}`);
  return file;
}

export function dateString(value, fallback = '') {
  const date = value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : String(value || fallback);
  if (!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(date)) throw new Error(`无效日期：${date}`);
  // Validate calendar dates rather than accepting Date's rollover behavior.
  const day = date.slice(0, 10);
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error(`无效日期：${date}`);
  return date;
}

export function plainText(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ').replace(/[#*_>`~|]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function readingMinutes(text) {
  const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.ceil(chinese / 400 + words / 220));
}

export function photoMetadata(tags = {}, { showLocation = false } = {}) {
  const result = {};
  const field = (key, value) => { if (value !== undefined && value !== null && value !== '') result[key] = value; };
  const make = String(tags.Make || '').trim();
  const model = String(tags.Model || '').trim();
  field('camera', model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' '));
  field('lens', tags.LensModel);
  field('aperture', tags.FNumber ? `f/${tags.FNumber}` : undefined);
  field('shutter', tags.ExposureTime > 0 ? (tags.ExposureTime < 1 ? `1/${Math.round(1 / tags.ExposureTime)} s` : `${tags.ExposureTime} s`) : undefined);
  field('iso', tags.ISO);
  field('focalLength', tags.FocalLength ? `${tags.FocalLength} mm` : undefined);
  // EXIF's wall-clock time has no timezone unless OffsetTimeOriginal is present.
  // exifr is configured not to turn it into a machine-timezone-dependent Date.
  field('takenAt', tags.DateTimeOriginal ? String(tags.DateTimeOriginal).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : undefined);
  field('utcOffset', tags.OffsetTimeOriginal);
  if (showLocation && Number.isFinite(tags.latitude) && Number.isFinite(tags.longitude)) {
    result.lat = Number(tags.latitude.toFixed(3));
    result.lng = Number(tags.longitude.toFixed(3));
  }
  return result;
}
