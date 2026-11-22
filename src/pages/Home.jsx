import React from 'react';
import DashboardTools from '../components/DashboardTools';
import Icon from '../components/Icon';
import { hrefFor, displayDate } from '../lib/navigation';

export default function Home({ writingPosts, photographyPosts, onOpenSearch }) {
  const photoCount = photographyPosts.reduce((count, album) => count + album.images.length, 0);
  const randomRead = () => {
    if (writingPosts.length) window.location.assign(hrefFor('writing', writingPosts[Math.floor(Math.random() * writingPosts.length)].slug));
  };
  return <div className="dashboard">
    <header className="dashboard-heading"><div><h1>我的一方天地。</h1><p>写下所想，留住所见，也留一点位置给新鲜事。</p></div><button className="dashboard-search" type="button" onClick={onOpenSearch}><Icon name="search" /><span>找点什么</span><kbd>⌘ K</kbd></button></header>
    <div className="dashboard-grid">
      <section className="dashboard-profile dashboard-card" aria-label="关于 Haotlas">
        <a className="profile-art" href="/artworks/gu-yue-fang-yuan.webp" target="_blank" rel="noreferrer" aria-label="查看完整插画：古月方源"><img src="/artworks/gu-yue-fang-yuan.webp" width="1284" height="1276" alt="古月方源，风雨中的人物与一只绿色蝴蝶" fetchPriority="high" /></a>
        <div className="profile-copy"><h2>Haotlas</h2><p>学习、阅读、摄影。<br />慢慢积累自己的记录。</p><a href={hrefFor('about')}>关于我</a></div>
      </section>
      <figure className="dashboard-landscape dashboard-card"><a href="/artworks/san-wang-shan.webp" target="_blank" rel="noreferrer" aria-label="查看完整插画：三王山大战"><img src="/artworks/san-wang-shan.webp" width="1284" height="714" alt="三王山大战，赤色天空下的山谷与飞鸟" fetchPriority="high" /></a><figcaption><span>三王山大战</span><span>一些偏爱的画面</span></figcaption></figure>
      <section className="dashboard-content dashboard-card" aria-labelledby="dashboard-writing"><header><div><h2 id="dashboard-writing"><a href={hrefFor('writing')}>文稿</a></h2><span>{writingPosts.length} 篇记录</span></div><a className="dashboard-view-all" href={hrefFor('writing')}>全部文稿</a></header><div className="dashboard-updates">{writingPosts.slice(0, 2).map(post => <a key={post.slug} href={hrefFor('writing', post.slug)}><h3>{post.title}</h3><time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time></a>)}</div><button className="dashboard-random" type="button" onClick={randomRead} disabled={!writingPosts.length}>随手读一篇</button></section>
      <section className="dashboard-content dashboard-card" aria-labelledby="dashboard-photography"><header><div><h2 id="dashboard-photography"><a href={hrefFor('photography')}>摄影</a></h2><span>{photographyPosts.length} 篇手记 · {photoCount} 张照片</span></div><a className="dashboard-view-all" href={hrefFor('photography')}>全部摄影</a></header><p className="dashboard-photo-note">镜头里的片刻，<br />还有照片之外的感受。</p><div className="dashboard-updates">{photographyPosts.slice(0, 1).map(post => <a key={post.slug} href={hrefFor('photography', post.slug)}><h3>{post.title}</h3><time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time></a>)}</div></section>
      <DashboardTools />
    </div>
  </div>;
}
