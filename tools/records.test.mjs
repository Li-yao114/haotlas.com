import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePoint, parseRating, normalizeRecord, foodRating } from '../src/lib/records.js';
import { unpackDocument } from './import-document.mjs';
import { zipSync, strToU8 } from 'fflate';

test('评分支持半星，未评分与零分区分，并拒绝非法范围和小数', () => {
  assert.equal(parseRating('4.5'),4.5); assert.equal(parseRating('unrated'),null);assert.equal(parseRating(''),null);
  for(const value of [0,5.5,-1,4.2,'NaN']) assert.throws(()=>parseRating(value));
  const record=normalizeRecord({category:'food',rating:'4.5',dimensions:[{name:'味道',score:'5'},{name:'服务',score:'unrated'}],cost:0});
  assert.deepEqual(record.dimensions,[{name:'味道',score:5}]); assert.equal(record.cost,0);assert.equal(record.rating,4.5);
  assert.throws(()=>normalizeRecord({dimensions:[{name:'体验',score:4},{name:'体验',score:5}]}));
});
test('地图经纬度顺序固定，无位置时保持空值，导航只接受网页链接',()=>{
  assert.deepEqual(parsePoint('104.10,30.69'),{lng:104.1,lat:30.69}); assert.equal(parsePoint(''),null);
  for(const value of ['30,','181,30','104,91','not a point']) assert.throws(()=>parsePoint(value));
  assert.throws(()=>normalizeRecord({navigationUrl:'javascript:alert(1)'}));
});
test('Typora ZIP 保留 Markdown 内容并按相对路径读取配图，剥离文件头',async()=>{
  const bytes=zipSync({'文章/游记.md':strToU8('---\ntitle: 另一个标题\n---\n\n# 正文\n\n![照片](游记.assets/a.png)\n'), '文章/游记.assets/a.png':new Uint8Array([1,2,3]),'__MACOSX/._游记.md':new Uint8Array([0])});
  const doc=unpackDocument(bytes);assert(doc.body.includes('# 正文'));assert(!doc.body.includes('title:'));assert.deepEqual([...((await doc.asset('游记.assets/a.png')).buffer)],[1,2,3]);await assert.rejects(()=>doc.asset('../missing.png'));
});
test('拒绝多篇文稿、越界路径以及没有 Markdown 的导入包',()=>{
  assert.throws(()=>unpackDocument(zipSync({'a.md':strToU8('A'),'b.md':strToU8('B')})));
  assert.throws(()=>unpackDocument(zipSync({'../a.md':strToU8('A')})));
  assert.throws(()=>unpackDocument(zipSync({'a.txt':strToU8('A')})));
});


test('美食按口味60%、态度20%、环境20%加权并取半星，缺项时不猜测',()=>{
  assert.equal(foodRating({taste:5,service:3,environment:4}).rating,4.5);
  assert.equal(foodRating({taste:5,service:3,environment:4}).raw,4.4);
  assert.equal(foodRating({taste:0.5,service:0.5,environment:0.5}).rating,0.5);
  assert.equal(foodRating({taste:5,service:5}).rating,null);
  const record=normalizeRecord({category:'food',foodRating:{taste:4.5,service:3,environment:5},rating:1});
  assert.equal(record.rating,4.5);assert.equal(record.ratingMode,'weighted');assert.equal(record.dimensions.length,3);
  assert.equal(normalizeRecord({category:'place',rating:3}).rating,3);
  assert.throws(()=>normalizeRecord({category:'constructor'}));
});
