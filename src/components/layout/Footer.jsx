import React, { useEffect, useState } from 'react';
import { LAUNCH_TIMESTAMP, formatDuration } from '../../lib/runtime';
import { site } from '../../lib/site';
import Icon from '../Icon';

export default function Footer() {
  const [runtime, setRuntime] = useState(() => formatDuration(Date.now() - LAUNCH_TIMESTAMP));
  useEffect(() => {
    const timer = setInterval(() => setRuntime(formatDuration(Date.now() - LAUNCH_TIMESTAMP)), 1000);
    return () => clearInterval(timer);
  }, []);
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date());
  return <footer className="site-footer"><span>© {year} {site.footer.copyright}</span><div className="footer-right"><span className="footer-runtime">本站已运行 <span>{runtime}</span></span><button type="button" className="top-link" onClick={() => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>返回顶部<Icon name="up" /></button></div></footer>;
}
