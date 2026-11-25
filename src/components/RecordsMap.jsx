import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';
const MapCanvas = lazy(() => import('./RecordsMapCanvas'));
export default function RecordsMap({ items, onPointPick, pickedPoint, focusPoint, picker = false }) {
  const host = useRef(null); const [visible, setVisible] = useState(false), [status, setStatus] = useState('loading'), [attempt, setAttempt] = useState(0);
  const { resolvedTheme } = useTheme();
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '180px' }); observer.observe(host.current); return () => observer.disconnect(); }, []);
  return <div className={`records-map${picker ? ' map-picker' : ''}`} ref={host} data-map-status={status}><div className="records-map-canvas-wrap">{visible && <Suspense fallback={null}><MapCanvas key={attempt} items={items} theme={resolvedTheme} picker={picker} onPointPick={onPointPick} pickedPoint={pickedPoint} focusPoint={focusPoint} onStatus={setStatus} /></Suspense>}{status !== 'ready' && <div className="record-map-state" role="status">{status === 'error' ? <><span>地图暂时未能载入，文字记录仍可阅读。</span><button onClick={() => { setStatus('loading'); setAttempt(value => value + 1); }}>重新加载</button></> : '正在展开地图…'}</div>}</div><div className="record-map-credit"><a href="https://openfreemap.org/">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></div></div>;
}
