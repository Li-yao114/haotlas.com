import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';

const MapCanvas = lazy(() => import('./CityMapCanvas'));

export default function CityMap() {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState('city');
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '180px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <section className="dashboard-card dashboard-map" ref={host} aria-labelledby="city-map-heading">
    <header className="city-map-heading"><div><h2 id="city-map-heading">在成都</h2><p>四川 · 成华</p></div><button type="button" disabled={status !== 'ready'} onClick={() => setView(current => current === 'city' ? 'world' : 'city')} aria-label={view === 'city' ? '切换到地球视角' : '回到成华区'}>{view === 'city' ? '看地球' : '回到成华'}</button></header>
    <div className="city-map-viewport" data-map-status={status} data-map-view={view}>
      {visible && <Suspense fallback={null}><MapCanvas key={attempt} theme={resolvedTheme} view={view} onStatus={setStatus} onReturn={() => setView('city')} /></Suspense>}
      {status !== 'ready' && <div className="city-map-state" role="status">{status === 'error' ? <><span>地图暂时未能展开</span><button type="button" onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>重新加载</button></> : <span>正在展开成都地图…</span>}</div>}
    </div>
    <footer className="city-map-footer"><span>成华区范围示意</span><span className="map-mouse-hint">拖动探索</span><span className="map-touch-hint">双指移动与缩放</span></footer>
    <div className="city-map-credit"><a href="https://openfreemap.org/">OpenFreeMap</a><span>© <a href="https://www.openmaptiles.org/">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></span></div>
  </section>;
}
