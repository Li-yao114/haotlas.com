export async function imageAsset(file, kind) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)) throw new Error('请选择 JPG、PNG、WebP、AVIF 或 GIF 图片。');
  if (file.size > 25 * 1024 * 1024) throw new Error('单张照片请小于 25 MB。');
  let blob = file, extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[file.type];
  if (kind !== 'photography' && file.type !== 'image/gif') {
    const bitmap = await createImageBitmap(file);
    try {
      if (Math.max(bitmap.width, bitmap.height) > 2400 || file.size > 3 * 1024 * 1024) {
        const ratio = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height)), canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片转换失败，请换一张图片。')), 'image/webp', 0.9)); extension = 'webp';
      }
    } finally { bitmap.close(); }
  }
  const folder = kind === 'photography' ? 'photography/photos' : `${kind}/assets`;
  return { path: `content/${folder}/${crypto.randomUUID()}.${extension}`, blob, name: file.name, uploaded: false };
}
