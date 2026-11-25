import React from 'react';
import ThemeToggle from '../theme/ThemeToggle';
import Icon from '../Icon';
import { hrefFor } from '../../lib/navigation';

const items = [['home', '首页'], ['writing', '文稿'], ['photography', '摄影'], ['records', '记录'], ['about', '关于']];

export default function Header({ currentPage, onOpenSearch }) {
  return <header className="site-header"><a className="wordmark" href={hrefFor('home')} aria-label="Haotlas 首页">Haotlas</a><nav className="navigation" aria-label="主导航">{items.map(([id, label]) => <a href={hrefFor(id)} key={id} className={[id === 'home' ? 'mobile-home' : '', currentPage === id ? 'active' : ''].filter(Boolean).join(' ') || undefined} aria-current={currentPage === id ? 'page' : undefined}>{label}</a>)}</nav><div className="header-actions"><button type="button" className="icon-btn" onClick={onOpenSearch} aria-label="打开搜索" title="搜索（⌘ K 或 /）"><Icon name="search" /></button><ThemeToggle /></div></header>;
}
