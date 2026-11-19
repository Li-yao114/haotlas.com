import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider } from './components/theme/ThemeProvider';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ReadingProgress from './components/ReadingProgress';
import ContentState from './components/ContentState';
import Home from './pages/Home';
import { loadPhotographyIndex, loadWritingIndex, getPageData } from './lib/content';
import { getRoute, hrefFor } from './lib/navigation';

const Writing = lazy(() => import('./pages/Writing'));
const Photography = lazy(() => import('./pages/Photography'));
const About = lazy(() => import('./pages/About'));
const SearchOverlay = lazy(() => import('./components/SearchOverlay'));

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [searchOpen, setSearchOpen] = useState(false);
  const [content, setContent] = useState(() => { const data = getPageData(); return data ? { writing: data.writing, photography: data.photography, loading: false, error: false } : { writing: [], photography: [], loading: true, error: false }; });
  const main = useRef(null);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  useEffect(() => {
    const update = () => {
      closeSearch();
      const next = getRoute();
      if (location.hash.startsWith('#/')) history.replaceState(null, '', hrefFor(next.page, next.slug));
      setRoute(next);
    };
    const follow = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.hash || !/^\/(?:$|writing(?:\/|$)|photography(?:\/|$)|about(?:\/|$))/.test(url.pathname)) return;
      event.preventDefault();
      history.pushState(null, '', url.pathname + url.search);
      update();
    };
    update();
    addEventListener('hashchange', update);
    addEventListener('popstate', update);
    document.addEventListener('click', follow);
    return () => { removeEventListener('hashchange', update); removeEventListener('popstate', update); document.removeEventListener('click', follow); };
  }, [closeSearch]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!document.querySelector('dialog[open]')) main.current?.focus({ preventScroll: true });
  }, [route.page, route.slug]);
  useEffect(() => {
    let live = true;
    Promise.all([loadWritingIndex(), loadPhotographyIndex()]).then(([writing, photography]) => {
      if (live) setContent({ writing, photography, loading: false, error: false });
    }).catch(() => { if (live) setContent({ writing: [], photography: [], loading: false, error: true }); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const shortcut = event => {
      const typing = event.target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable);
      if (document.querySelector('.lightbox[open]')) return;
      if ((!typing && event.key === '/') || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault(); setSearchOpen(true);
      }
    };
    addEventListener('keydown', shortcut);
    return () => removeEventListener('keydown', shortcut);
  }, []);
  useEffect(() => {
    const selected = route.page === 'writing' ? content.writing : route.page === 'photography' ? content.photography : [];
    const post = selected.find(item => item.slug === route.slug);
    const title = post?.title || { writing: '文稿', photography: '摄影', about: '关于' }[route.page];
    document.title = title ? `${title} — Haotlas` : 'Haotlas — 文稿与摄影';
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://haotlas.com${hrefFor(route.page, route.slug)}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', post?.summary || 'Haotlas 的个人网站，记录技术学习、读书感悟、摄影和生活。');
  }, [route, content]);
  let page;
  if (route.page === 'about') page = <About />;
  else if (content.loading) page = <div className="content-loading" role="status">正在加载内容…</div>;
  else if (content.error) page = <ContentState title="内容暂时无法加载" retry={() => location.reload()}>请稍后重试。</ContentState>;
  else if (route.page === 'writing') page = <Writing posts={content.writing} selectedSlug={route.slug} />;
  else if (route.page === 'photography') page = <Photography albums={content.photography} selectedSlug={route.slug} />;
  else if (route.page === 'home') page = <Home writingPosts={content.writing} photographyPosts={content.photography} />;
  else page = <ContentState title="这个页面暂未收录" />;
  return <ThemeProvider><a className="skip" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); main.current?.scrollIntoView({ block: 'start' }); }}>跳至正文</a><div className="shell"><Header currentPage={route.page} onOpenSearch={() => setSearchOpen(true)} /><main id="main" tabIndex={-1} ref={main}><Suspense fallback={<div className="content-loading" role="status">正在加载内容…</div>}><div className="page" key={`${route.page}/${route.slug || ''}`}>{page}</div></Suspense></main><Footer /></div>{route.slug && ['writing', 'photography'].includes(route.page) && <ReadingProgress key={`${route.page}/${route.slug}`} />}{searchOpen && <Suspense fallback={null}><SearchOverlay onClose={closeSearch} writingPosts={content.writing} photographyPosts={content.photography} /></Suspense>}</ThemeProvider>;
}
