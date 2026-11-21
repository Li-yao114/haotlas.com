import React from 'react';
import WritingList from '../components/WritingList';
import { hrefFor } from '../lib/navigation';

export default function Home({ writingPosts, photographyPosts }) {
  const photoCount = photographyPosts.reduce((count, album) => count + album.images.length, 0);
  return <div className="home-index">
    <header className="home-intro"><h1>文稿、摄影与记录。</h1><p>一些学习、阅读和日常的记录。</p></header>
    <section className="home-notes" aria-labelledby="home-writing-title"><div className="home-section-head"><h2 id="home-writing-title">文稿</h2><a className="text-link" href={hrefFor('writing')}>查看全部 {writingPosts.length} 篇</a></div>{writingPosts.length ? <WritingList posts={writingPosts.slice(0, 4)} /> : <p className="muted">还没有公开的文稿。</p>}</section>
    <section className="home-photo-entry" aria-labelledby="home-photography-title"><a href={hrefFor('photography')}><div><h2 id="home-photography-title">摄影</h2><p>镜头里的片刻，和照片之外的感受。</p></div><span>{photographyPosts.length} 篇手记 / {photoCount} 张照片</span></a></section>
  </div>;
}
