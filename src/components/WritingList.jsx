import React from 'react';
import { hrefFor, displayDate } from '../lib/navigation';

export default function WritingList({ posts }) {
  return <div className="writing-list">{posts.map(post => (
    <a className="writing-row" href={hrefFor('writing', post.slug)} key={post.slug}>
      <time dateTime={post.date.slice(0, 10)}>{displayDate(post.date)}</time>
      <div><h3>{post.title}</h3>{post.summary && post.summary.toLocaleLowerCase() !== post.title.toLocaleLowerCase() && <p>{post.summary}</p>}</div>
      <span className="row-reading">{post.readingMinutes} 分钟</span>
    </a>
  ))}</div>;
}
