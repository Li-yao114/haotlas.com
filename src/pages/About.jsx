import React from 'react';
import { hrefFor } from '../lib/navigation';

export default function About() {
  return <section className="about-layout"><h1>关于 Haotlas</h1><p>这里存放文稿、摄影与长期记录。</p><p>有技术学习时留下的实验笔记，也有读书后的想法，以及镜头里的城市。</p><div className="about-links"><a className="text-link" href={hrefFor('writing')}>阅读文稿</a><a className="text-link" href={hrefFor('photography')}>浏览摄影手记</a></div></section>;
}
