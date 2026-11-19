import test from 'node:test';
import assert from 'node:assert/strict';
import { safePath, dateString, photoMetadata, plainText, readingMinutes } from './content-utils.mjs';

test('照片缺失参数时不生成猜测值；GPS 默认不会进入公开信息', () => {
  assert.deepEqual(photoMetadata(), {});
  const raw = { Make: 'Canon', Model: 'Canon EOS R5', ISO: 400, ExposureTime: 1 / 125, latitude: 30.123456, longitude: 104.654321 };
  assert.deepEqual(photoMetadata(raw), { camera: 'Canon EOS R5', shutter: '1/125 s', iso: 400 });
  assert.equal(photoMetadata(raw, { showLocation: true }).lat, 30.123);
});

test('原始 EXIF 拍摄时间保持墙上时间，不受构建机器时区影响', () => {
  assert.equal(photoMetadata({ DateTimeOriginal: '2024:11:20 19:21:30' }).takenAt, '2024-11-20 19:21:30');
});

test('内容引用不能逃出源目录，中文和空格路径仍可用', () => {
  assert.throws(() => safePath('/tmp/site/content', '../../secret'));
  assert.equal(safePath('/tmp/site/content', 'writing/文稿 图片.png'), '/tmp/site/content/writing/文稿 图片.png');
});

test('索引日期稳定排序并拒绝无效日期', () => {
  assert.equal(dateString('2024-05-14 09:53:04'), '2024-05-14 09:53:04');
  assert.throws(() => dateString('2024-02-30'));
});

test('摘要剔除图片与代码地址，中文阅读时间有合理下界', () => {
  assert.equal(plainText('## 标题\n![图](/image.jpg)\n[正文](https://example.com)\n```js\nx()\n```'), '标题 正文');
  assert.equal(readingMinutes('文'.repeat(800)), 2);
});
