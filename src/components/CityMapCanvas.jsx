import React, { useEffect, useRef, useState } from 'react';
import { Map, Marker, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);
// A representative area within Chenghua, not a personal address.
const CENTER = [104.10, 30.69];
const CITY_ZOOM = 10.8;
const styleUrl = theme => `https://tiles.openfreemap.org/styles/${theme === 'dark' ? 'dark' : 'positron'}`;
const area = Array.from({ length: 65 }, (_, index) => {
  const angle = index / 64 * Math.PI * 2;
  return [CENTER[0] + Math.cos(angle) * 3.5 / (111 * Math.cos(CENTER[1] * Math.PI / 180)), CENTER[1] + Math.sin(angle) * 3.5 / 111];
});

export default function CityMapCanvas({ theme, view, onStatus, onReturn }) {
  const container = useRef(null), map = useRef(null), activeTheme = useRef(theme), returnHome = useRef(onReturn);
  const [ready, setReady] = useState(false);
  returnHome.current = onReturn;
  useEffect(() => {
    let instance, marker, observer, timeout;
    try {
      instance = new Map({
        container: container.current, style: styleUrl(activeTheme.current), center: CENTER, zoom: CITY_ZOOM,
        minZoom: -.5, maxZoom: 14, pitch: 0, bearing: 0, cooperativeGestures: true,
        attributionControl: false, canvasContextAttributes: { antialias: true },
        locale: { 'CooperativeGesturesHandler.WindowsHelpText': '按住 Ctrl 并滚动以缩放地图', 'CooperativeGesturesHandler.MacHelpText': '按住 ⌘ 并滚动以缩放地图', 'CooperativeGesturesHandler.MobileHelpText': '使用双指移动地图' },
      });
      map.current = instance;
      instance.getCanvas().setAttribute('aria-label', '成都成华区交互地图');
      instance.on('style.load', () => {
        instance.setProjection({ type: 'globe' });
        instance.addSource('earth-imagery', { type: 'raster', tiles: ['https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 6 });
        instance.addLayer({ id: 'earth-imagery', type: 'raster', source: 'earth-imagery', maxzoom: 4, paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3, 1, 4, 0] } });
        instance.addSource('chenghua-area', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [area] } } });
        instance.addLayer({ id: 'chenghua-area-fill', type: 'fill', source: 'chenghua-area', paint: { 'fill-color': '#76bda6', 'fill-opacity': .12 } });
        instance.addLayer({ id: 'chenghua-area-outline', type: 'line', source: 'chenghua-area', paint: { 'line-color': '#76bda6', 'line-width': 1.5, 'line-opacity': .65, 'line-dasharray': [2, 2] } });
        for (const layer of instance.getStyle().layers) {
          if (layer.type === 'symbol' && layer.layout?.['text-field']) instance.setPaintProperty(layer.id, 'text-opacity', ['step', ['zoom'], 0, 4, 1]);
          if (layer.type === 'symbol' && (JSON.stringify(layer.layout?.['text-field']) || '').includes('name')) instance.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:zh'], ['get', 'name'], ['get', 'name:latin']]);
        }
        marker?.setLngLat(CENTER);
      });
      const pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'city-map-pin'; pin.setAttribute('aria-label', '返回成华区范围');
      const avatar = document.createElement('img'); avatar.src = '/favicon-eren.png'; avatar.alt = ''; avatar.width = 34; avatar.height = 34;
      const label = document.createElement('span'); label.textContent = '成都 · 成华';
      pin.append(avatar, label); pin.addEventListener('click', () => { returnHome.current(); instance.flyTo({ center: CENTER, zoom: CITY_ZOOM, pitch: 0, bearing: 0, duration: 900 }); });
      marker = new Marker({ element: pin, anchor: 'bottom' }).setLngLat(CENTER).addTo(instance);
      instance.on('load', () => { clearTimeout(timeout); setReady(true); onStatus('ready'); });
      instance.on('webglcontextlost', () => onStatus('error'));
      timeout = setTimeout(() => { if (!instance.loaded()) onStatus('error'); }, 20000);
      observer = new ResizeObserver(() => instance.resize()); observer.observe(container.current);
    } catch { onStatus('error'); }
    return () => { clearTimeout(timeout); observer?.disconnect(); marker?.remove(); instance?.remove(); map.current = null; };
  }, [onStatus]);
  useEffect(() => {
    if (map.current && activeTheme.current !== theme) { activeTheme.current = theme; map.current.setStyle(styleUrl(theme)); }
  }, [theme]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    map.current.flyTo({ center: CENTER, zoom: view === 'world' ? .15 : CITY_ZOOM, pitch: 0, bearing: 0, duration: reduceMotion ? 0 : 1800 });
  }, [view, ready]);
  return <><div ref={container} className="city-map-canvas" /><div className="city-map-zoom"><button type="button" aria-label="放大地图" disabled={!ready} onClick={() => map.current?.zoomIn()}>＋</button><button type="button" aria-label="缩小地图" disabled={!ready} onClick={() => map.current?.zoomOut()}>−</button></div></>;
}
