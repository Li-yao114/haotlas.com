import React from 'react';
import PhotoStage from '../components/PhotoStage';
import WritingList from '../components/WritingList';
import AlbumList from '../components/AlbumList';
import { hrefFor } from '../lib/navigation';

export default function Home({ writingPosts, photographyPosts }) {
  const featured = photographyPosts[0];
  return <>
    {featured ? <PhotoStage key={featured.slug} album={featured} home /> : <header className="page-title"><div><h1>Haotlas</h1><p>文稿、摄影与长期记录。</p></div></header>}
    <section className="home-writing section-divider"><div className="section-heading"><h2>最近文稿</h2><p>技术、阅读，以及生活中的一些记录。</p><a className="text-link" href={hrefFor('writing')}>全部 {writingPosts.length} 篇文稿</a></div>{writingPosts.length ? <WritingList posts={writingPosts.slice(0, 3)} /> : <p className="muted">还没有公开的文稿。</p>}</section>
    {!!photographyPosts.length && <section className="home-photography section-divider"><div className="section-heading"><h2>摄影手记</h2><p>看见的风景，和当时的想法。</p><a className="text-link" href={hrefFor('photography')}>全部 {photographyPosts.length} 篇摄影手记</a></div><AlbumList albums={photographyPosts.slice(0, 2)} compact /></section>}
  </>;
}
