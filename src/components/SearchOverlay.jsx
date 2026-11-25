import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadJson } from '../lib/content';
import Modal from './Modal';
import Icon from './Icon';
import { hrefFor, displayDate } from '../lib/navigation';

export default function SearchOverlay({ onClose, writingPosts, photographyPosts, records = [] }) {
  const [query, setQuery] = useState(''), [fullText, setFullText] = useState([]);
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    let live = true;
    loadJson('/content/search.json').then(data => { if (live) setFullText(data); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return [...writingPosts.map(post => ({ ...post, type: 'writing' })), ...photographyPosts.map(post => ({ ...post, type: 'photography' })), ...records.map(post => ({ ...post, type: 'records' }))].filter(post => {
      const text = fullText.find(entry => entry.slug === post.slug && entry.file === post.file)?.text || '';
      return !q || `${post.title} ${post.summary} ${post.tags.join(' ')} ${text}`.toLocaleLowerCase().includes(q);
    });
  }, [query, fullText, writingPosts, photographyPosts, records]);
  useEffect(() => { setActive(0); }, [query]);
  const move = (event, delta) => {
    if (!results.length) return;
    event.preventDefault();
    const next = (active + delta + results.length) % results.length;
    setActive(next); refs.current[next]?.scrollIntoView({ block: 'nearest' });
  };
  return <Modal label="搜索文稿、摄影与记录" onClose={onClose}><div className="dialog-head"><Icon name="search" /><input type="search" autoFocus aria-label="搜索文稿、摄影与记录" placeholder="搜索文稿、摄影与记录" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key === 'ArrowDown') move(event, 1);
    if (event.key === 'ArrowUp') move(event, -1);
    if (event.key === 'Enter' && results[active]) { event.preventDefault(); refs.current[active]?.click(); }
  }} /><button type="button" className="icon-btn" onClick={onClose} aria-label="关闭搜索"><Icon name="close" /></button></div><div className="search-results">{results.length ? results.map((result, index) => <a className={`search-result${active === index ? ' search-result-active' : ''}`} ref={node => { refs.current[index] = node; }} href={hrefFor(result.type, result.slug)} key={`${result.type}/${result.slug}`} onClick={onClose} onMouseEnter={() => setActive(index)}><span>{result.title}</span><small>{result.type === 'photography' ? '摄影手记' : result.type === 'records' ? '记录' : '文稿'} / {displayDate(result.date)}</small></a>) : <p className="search-empty">没有找到相关内容，试试其他关键词。</p>}</div><div className="dialog-foot"><span role="status">{results.length} 篇{query ? '相关内容' : '记录'}</span><span>方向键选择　Enter 打开　Esc 关闭</span></div></Modal>;
}
