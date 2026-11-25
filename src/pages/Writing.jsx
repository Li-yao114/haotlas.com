import { site } from '../lib/site';
import React, { useState } from 'react';
import MarkdownContent from '../components/MarkdownContent';
import WritingList from '../components/WritingList';
import ContentState from '../components/ContentState';
import Icon from '../components/Icon';
import useMarkdown from '../hooks/useMarkdown';
import { hrefFor, displayDate } from '../lib/navigation';

function Article({ post, posts, initialBody }) {
  const { body, loading, error } = useMarkdown(post.file, initialBody);
  const next = posts[posts.indexOf(post) + 1];
  return <article className="reading"><a className="reading-back" href={hrefFor('writing')}><Icon name="left" />返回文稿</a><header className="reading-header"><h1>{post.title}</h1><div className="reading-meta"><time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time><span>约 {post.readingMinutes} 分钟</span></div>{!!post.tags.length && <div className="article-tags">{post.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}</header>{loading ? <p className="muted" role="status">正在加载正文…</p> : error ? <p role="alert">正文暂时无法加载，请刷新后重试。</p> : <div className="article-body"><MarkdownContent>{body}</MarkdownContent></div>}{next && <nav className="reading-next" aria-label="继续阅读"><span className="muted">下一篇</span><a href={hrefFor('writing', next.slug)}>{next.title}<Icon name="right" /></a></nav>}</article>;
}

export default function Writing({ posts, selectedSlug, initialBody }) {
  const [year, setYear] = useState('all');
  if (selectedSlug) {
    const post = posts.find(item => item.slug === selectedSlug);
    return post ? <Article key={post.slug} post={post} posts={posts} initialBody={initialBody} /> : <ContentState title="这篇文稿暂未收录" back="writing" backLabel="查看全部文稿" />;
  }
  const years = [...new Set(posts.map(post => post.date.slice(0, 4)))];
  const filtered = year === 'all' ? posts : posts.filter(post => post.date.startsWith(year));
  return <><header className="page-title"><div><h1>{site.pages.writingTitle}</h1><p>{site.pages.writingDescription}</p></div><span className="count">{posts.length} 篇</span></header><section className="writing-archive"><nav className="year-index" aria-label="按年份筛选文稿">{[['all', '全部'], ...years.map(y => [y, y])].map(([value, label]) => <button type="button" key={value} onClick={() => setYear(value)} aria-pressed={year === value}>{label}</button>)}</nav><div className="archive-list">{filtered.length ? <WritingList posts={filtered} /> : <p className="muted">还没有公开的文稿。</p>}</div></section></>;
}
