import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecord, writeRecord, newRecord } from '../src/editor/record-document.js';
import { githubContent } from '../src/editor/github-content.js';
import { importPreview } from '../src/editor/import-preview.js';
import { zipSync, strToU8 } from 'fflate';

test('记录保存保留 Markdown 与自定义字段，阻止不完整评分发布，并校验真实日期', () => {
  const source = '\uFEFF---\ntitle: 面馆\ncategory: food\ncustom: 保留我\n---\n\n# 正文\n\n文字';
  const {data, body} = readRecord(source); assert.equal(body, '# 正文\n\n文字');
  const metadata = {...data, date:'2026-11-25', draft:true, foodRating:{taste:5,service:4,environment:3}};
  assert.equal(readRecord(writeRecord(metadata, body)).data.custom, '保留我');
  assert.equal(readRecord(writeRecord(metadata, body)).data.rating, 4.5);
  assert.equal(readRecord(writeRecord({...metadata,sourceDocument:'/content/documents/test.zip'},body)).data.sourceDocument,'/content/documents/test.zip');
  assert.throws(()=>writeRecord({...metadata,slug:'../../outside'},body));
  assert.equal(readRecord(writeRecord({...metadata,slug:'旧地址/文章'},body)).data.slug,'旧地址/文章');
  assert.throws(()=>writeRecord({...metadata,date:'2026-02-30'},body));
  assert.throws(()=>writeRecord({...metadata,draft:false,foodRating:{taste:5}},body));
  assert.equal(readRecord(writeRecord({...metadata,foodRating:{taste:5}},body)).data.rating,'unrated');
  assert.match(newRecord().data.date,/^\d{4}-\d{2}-\d{2}$/);
});
test('编辑器导入 Typora ZIP 可预览正文和图片；拒绝多个文稿',async()=>{
  const blob=new Blob([zipSync({'游记.md':strToU8('# 今天\n\n![配图](游记.assets/a.png)'), '游记.assets/a.png':new Uint8Array([1,2,3])})]);
  const result=await importPreview(blob,'游记.zip');assert(result.body.includes('# 今天'));assert.equal(result.images[0].path,'游记.assets/a.png');
  await assert.rejects(()=>importPreview(new Blob([zipSync({'a.md':strToU8('A'),'b.md':strToU8('B')})]),'a.zip'));
});
test('GitHub 同步把正文和附件放进同一个提交，且不强制覆盖分支',async()=>{
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,options)=>{
    const path=String(url).split('haotlas.com')[1];calls.push({path,method:options.method||'GET',body:options.body?JSON.parse(options.body):null});
    if(path.startsWith('/contents/'))return Response.json({message:'Not Found'},{status:404});
    if(path==='/git/ref/heads/main')return Response.json({object:{sha:'base'}});
    if(path==='/git/commits/base')return Response.json({sha:'base',tree:{sha:'base-tree'}});
    if(path==='/git/blobs')return Response.json({sha:'blob-'+calls.length});
    if(path==='/git/trees')return Response.json({sha:'new-tree'});
    if(path==='/git/commits')return Response.json({sha:'new-commit'});
    if(path==='/git/refs/heads/main')return Response.json({});
    throw new Error('unexpected path');
  };
  try{
    const result=await githubContent('test-only-placeholder').publish({path:'content/records/new.md',sha:null,text:'正文',assets:[{path:'content/records/assets/picture.jpg',blob:new Blob(['image'])}]});
    assert.equal(result.commit,'new-commit');const tree=calls.find(call=>call.path==='/git/trees').body;assert.equal(tree.tree.length,2);assert.equal(tree.base_tree,'base-tree');assert.equal(calls.filter(call=>call.path==='/git/commits').length,1);assert.equal(calls.find(call=>call.method==='PATCH').body.force,false);
  }finally{globalThis.fetch=original;}
});
test('同步拒绝越界写入与并发修改，避免覆盖其他编辑结果',async()=>{
  const client=githubContent('test-only-placeholder');await assert.rejects(()=>client.publish({path:'src/App.jsx',sha:null,text:'A'}));
  const original=globalThis.fetch;
  globalThis.fetch=async()=>Response.json({sha:'newer-sha'});
  try{await assert.rejects(()=>client.publish({path:'content/records/test.md',sha:'old-sha',text:'A'}),/其他窗口/);}finally{globalThis.fetch=original;}
});
