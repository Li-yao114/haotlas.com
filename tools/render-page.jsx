import React from 'react';
import { renderToString } from 'react-dom/server';
import Header from '../src/components/layout/Header';
import Footer from '../src/components/layout/Footer';
import Home from '../src/pages/Home';
import Writing from '../src/pages/Writing';
import Photography from '../src/pages/Photography';
import Records from '../src/pages/Records';
import About from '../src/pages/About';
import ContentState from '../src/components/ContentState';

export function renderPage({ page, slug, writing, photography, records, body }) {
  let content;
  if (page === 'home') content = <Home writingPosts={writing} photographyPosts={photography} records={records} />;
  else if (page === 'writing') content = <Writing posts={writing} selectedSlug={slug} initialBody={body} />;
  else if (page === 'photography') content = <Photography albums={photography} selectedSlug={slug} initialBody={body} />;
  else if (page === 'records') content = <Records records={records} selectedSlug={slug} initialBody={body} />;
  else if (page === 'about') content = <About />;
  else content = <ContentState title="这个页面暂未收录" />;
  return renderToString(<div className="shell"><Header currentPage={page} onOpenSearch={() => {}} /><main id="main">{content}</main><Footer /></div>);
}
