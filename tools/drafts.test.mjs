import test from 'node:test';
import assert from 'node:assert/strict';
import { draftFingerprint, hasDraftContent, localDraftStatus, libraryEntries, filterLibrary } from '../src/editor/draft-model.js';
import { githubContent, gitBlobSha } from '../src/editor/github-content.js';

const blank=()=>({kind:'writing',path:'content/writing/a.md',sha:null,data:{title:'',date:'2026-11-25',draft:true,slug:'a',tags:[]},body:'',assets:[]});
test('空白占位不算草稿；文字、附件和图片都属于实际内容',()=>{
  assert.equal(hasDraftContent(blank()),false);
  assert.equal(hasDraftContent({...blank(),body:'第一段文字'}),true);
  assert.equal(hasDraftContent({...blank(),assets:[{blob:new Blob(['photo'])}]}),true);
  assert.equal(hasDraftContent({...blank(),data:{...blank().data,mapPoint:'104,30'}}),true);
});
test('独立草稿按路径保留，已发布副本不混入草稿，支持标题和正文筛选',()=>{
  const a={...blank(),data:{...blank().data,title:'第一篇'},body:'面馆回忆',updated:1};
  const b={...a,path:'content/writing/b.md',data:{...a.data,title:'第二篇'},body:'读书笔记',updated:2};
  const published={...a,path:'content/writing/c.md',sha:'published-sha',data:{...a.data,title:'已发布',draft:false}};published.baseline=draftFingerprint(published);
  const archived={...a,path:'content/writing/d.md',trashedAt:3};
  const entries=libraryEntries([blank(),a,b,published,archived],[],'writing');
  assert.equal(filterLibrary(entries,'local').length,2);assert.equal(filterLibrary(entries,'published').length,1);assert.equal(filterLibrary(entries,'trash').length,1);
  assert.equal(filterLibrary(entries,'local','面馆')[0].path,a.path);assert.equal(filterLibrary(entries,'all').length,3);
  assert.equal(localDraftStatus({...a,sha:'old'}),'unverified');
});
test('云端草稿与本地修改合并为一行，仍能分别筛选',()=>{
  const local={...blank(),data:{...blank().data,title:'本地修改'},sha:'old'};
  const files=[{path:local.path,name:'a.md',sha:'old',state:'github-draft',title:'云端草稿'}];
  const rows=libraryEntries([local],files,'writing');assert.equal(rows.length,1);assert.equal(filterLibrary(rows,'local').length,1);
  local.baseline=draftFingerprint(local);assert.equal(filterLibrary(libraryEntries([local],files,'writing'),'drafts').length,1);
});
test('Git Blob 校验包含 UTF-8 字节长度',async()=>{
  assert.equal(await gitBlobSha('hello\n'),'ce013625030ba8dba906f756967f9e9ca394464a');
  assert.notEqual(await gitBlobSha('你好'),await gitBlobSha('你好\n'));
});
test('无新附件的草稿同步只读一次再更新文件，不再经过多步提交',async()=>{
  const original=globalThis.fetch,calls=[],text='---\ntitle: 草稿\ndraft: true\n---\n正文',sha=await gitBlobSha(text);
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return options.method==='PUT'?Response.json({content:{sha},commit:{sha:'commit'}}):Response.json({}, {status:404});};
  try {const result=await githubContent('test-placeholder').publish({path:'content/writing/a.md',sha:null,text});assert.equal(result.sha,sha);assert.equal(calls.length,2);assert.equal(calls[1].options.method,'PUT');}
  finally{globalThis.fetch=original;}
});
test('服务器已保存但回包丢失时核对内容，重试不会重复提交',async()=>{
  const original=globalThis.fetch,text='---\ntitle: 已保存\n---\n内容',sha=await gitBlobSha(text);let saved=false,puts=0;
  globalThis.fetch=async(url,options)=>{if(options.method==='PUT'){puts++;saved=true;throw new TypeError('connection lost');}return saved?Response.json({sha}):Response.json({}, {status:404});};
  try {const client=githubContent('test-placeholder');const first=await client.publish({path:'content/writing/a.md',sha:null,text});assert.equal(first.recovered,true);const second=await client.publish({path:'content/writing/a.md',sha:null,text});assert.equal(second.sha,sha);assert.equal(puts,1);}
  finally{globalThis.fetch=original;}
});
test('草稿保存结果未返回而本地 SHA 过期时，可用上次内容校验继续发布',async()=>{
  const original=globalThis.fetch,text='发布正文',target=await gitBlobSha(text);let put;
  globalThis.fetch=async(url,options)=>{if(options.method==='PUT'){put=JSON.parse(options.body);return Response.json({content:{sha:target},commit:{sha:'new'}});}return Response.json({sha:'previous-draft-sha'});};
  try {await githubContent('test-placeholder').publish({path:'content/writing/a.md',sha:null,text,previousAttempt:{targetSha:'previous-draft-sha'}});assert.equal(put.sha,'previous-draft-sha');}
  finally{globalThis.fetch=original;}
});
test('回应正文卡住也会超时退出，不会一直显示正在处理',{timeout:2000},async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({status:200,ok:true,json:()=>new Promise(()=>{})});
  try {await assert.rejects(()=>githubContent('test-placeholder',{requestTimeoutMs:25}).publish({path:'content/writing/a.md',sha:null,text:'A'}),error=>error.code==='TIMEOUT');}
  finally{globalThis.fetch=original;}
});
test('附件上传可停止等待，并释放发布操作',{timeout:2000},async()=>{
  const original=globalThis.fetch,controller=new AbortController();
  globalThis.fetch=async(url,options)=>{if(options.method==='POST'){setTimeout(()=>controller.abort(),20);return new Promise(()=>{});}return Response.json({}, {status:404});};
  try {await assert.rejects(()=>githubContent('test-placeholder').publish({path:'content/writing/a.md',sha:null,text:'A',assets:[{path:'content/writing/assets/a.jpg',blob:new Blob(['image'])}],signal:controller.signal}),error=>error.code==='ABORTED');}
  finally{globalThis.fetch=original;}
});
