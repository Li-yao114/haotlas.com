import React, { lazy, Suspense, useState } from 'react';
import { site } from '../lib/site';
import DashboardTools from '../components/DashboardTools';
import Icon from '../components/Icon';
import { hrefFor, displayDate } from '../lib/navigation';

const Lightbox = lazy(() => import('../components/Lightbox'));
const artworks = {
  title: '偏爱的画面',
  images: [
    { src: '/artworks/gu-yue-fang-yuan.webp', full: '/artworks/gu-yue-fang-yuan.webp', caption: '古月方源' },
    { src: '/artworks/san-wang-shan.webp', full: '/artworks/san-wang-shan.webp', caption: '三王山大战' },
  ],
};

export default function Home({ writingPosts, photographyPosts, records = [], onOpenSearch }) {
  const [artworkIndex, setArtworkIndex] = useState(null);
  const photoCount = photographyPosts.reduce((count, album) => count + album.images.length, 0);
  const randomRead = () => {
    if (writingPosts.length) window.location.assign(hrefFor('writing', writingPosts[Math.floor(Math.random() * writingPosts.length)].slug));
  };
  return <div className="dashboard">
    <header className="dashboard-heading"><div><h1>{site.home.title}</h1><p>{site.home.description}</p></div><button className="dashboard-search" type="button" onClick={onOpenSearch}><Icon name="search" /><span>找点什么</span><kbd>⌘ K</kbd></button></header>
    <div className="dashboard-grid">
      <section className="dashboard-profile dashboard-card" aria-label="关于 Haotlas">
        <button className="profile-art artwork-trigger" type="button" onClick={() => setArtworkIndex(0)} aria-label="查看完整插画：古月方源"><img src="/artworks/gu-yue-fang-yuan.webp" width="1284" height="1276" alt="古月方源，风雨中的人物与一只绿色蝴蝶" fetchPriority="high" /></button>
        <div className="profile-copy"><h2>{site.home.profileName}</h2><p>{site.home.profileBio}</p><a href={hrefFor('about')}>关于我</a></div>
      </section>
      <figure className="dashboard-landscape dashboard-card"><button className="dashboard-artwork artwork-trigger" type="button" onClick={() => setArtworkIndex(1)} aria-label="查看完整插画：三王山大战"><img src="/artworks/san-wang-shan.webp" width="1284" height="714" alt="三王山大战，赤色天空下的山谷与飞鸟" fetchPriority="high" /></button><figcaption><span>三王山大战</span><span>{site.home.artworkCaption}</span></figcaption></figure>
      <section className="dashboard-content dashboard-card" aria-labelledby="dashboard-writing"><header><div><h2 id="dashboard-writing"><a href={hrefFor('writing')}>{site.pages.writingTitle}</a></h2><span>{writingPosts.length} 篇记录</span></div><a className="dashboard-view-all" href={hrefFor('writing')}>全部文稿</a></header><div className="dashboard-updates">{writingPosts.slice(0, 2).map(post => <a key={post.slug} href={hrefFor('writing', post.slug)}><h3>{post.title}</h3><time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time></a>)}</div><button className="dashboard-random" type="button" onClick={randomRead} disabled={!writingPosts.length}>随手读一篇</button></section>
      <section className="dashboard-content dashboard-card" aria-labelledby="dashboard-photography"><header><div><h2 id="dashboard-photography"><a href={hrefFor('photography')}>{site.pages.photographyTitle}</a></h2><span>{photographyPosts.length} 篇手记 · {photoCount} 张照片</span></div><a className="dashboard-view-all" href={hrefFor('photography')}>全部摄影</a></header><p className="dashboard-photo-note">{site.home.photographyIntro}</p><div className="dashboard-updates">{photographyPosts.slice(0, 1).map(post => <a key={post.slug} href={hrefFor('photography', post.slug)}><h3>{post.title}</h3><time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time></a>)}</div></section>
      <a className="dashboard-record-entry dashboard-card" href={hrefFor('records')}><div><h2>{site.pages.recordsTitle}</h2><p>{site.home.recordsIntro}</p></div><span>{records.length} 条记录</span></a>
      <DashboardTools />
    </div>
    {artworkIndex !== null && <Suspense fallback={null}><Lightbox album={artworks} index={artworkIndex} onChange={setArtworkIndex} onClose={() => setArtworkIndex(null)} /></Suspense>}
  </div>;
}
