import React from 'react';
import { hrefFor } from '../lib/navigation';
import { site } from '../lib/site';
import MarkdownContent from '../components/MarkdownContent';
export default function About() {
  return <section className="about-layout"><h1>{site.about.title}</h1><div className="about-body article-body"><MarkdownContent>{site.about.body}</MarkdownContent></div><div className="about-links"><a className="text-link" href={hrefFor('writing')}>阅读文稿</a><a className="text-link" href={hrefFor('photography')}>浏览摄影手记</a><a className="text-link" href={hrefFor('records')}>查看记录</a></div></section>;
}
