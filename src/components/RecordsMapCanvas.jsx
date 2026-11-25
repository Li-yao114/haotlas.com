import React, { useEffect, useRef } from 'react';
import { Map, Marker, Popup, NavigationControl, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { hrefFor } from '../lib/navigation';
setWorkerUrl(workerUrl);
const style = theme => `https://tiles.openfreemap.org/styles/${theme === 'dark' ? 'dark' : 'positron'}`;
export default function RecordsMapCanvas({ items = [], theme, picker, onPointPick, pickedPoint, onStatus }) {
  const host = useRef(null), map = useRef(null), markers = useRef([]), pointMarker = useRef(null), pick = useRef(onPointPick), themeRef = useRef(theme);
  pick.current = onPointPick;
  useEffect(() => {
    let instance, observer, timeout;
    try {
      instance = new Map({ container: host.current, style: style(themeRef.current), center: [104.10, 30.69], zoom: 11, minZoom: 1, maxZoom: 18, cooperativeGestures: true, attributionControl: false, locale: { 'CooperativeGesturesHandler.MobileHelpText': '使用双指移动地图', 'CooperativeGesturesHandler.WindowsHelpText': '按住 Ctrl 并滚动以缩放地图', 'CooperativeGesturesHandler.MacHelpText': '按住 ⌘ 并滚动以缩放地图' } });
      map.current = instance; instance.getCanvas().setAttribute('aria-label', picker ? '点击地图选择位置' : '记录地点地图');
      instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      instance.on('click', event => { if (picker) pick.current?.({ lng: Number(event.lngLat.lng.toFixed(6)), lat: Number(event.lngLat.lat.toFixed(6)) }); });
      instance.on('load', () => { clearTimeout(timeout); onStatus('ready'); });
      timeout = setTimeout(() => { if (!instance.loaded()) onStatus('error'); }, 20000);
      observer = new ResizeObserver(() => instance.resize()); observer.observe(host.current);
    } catch { onStatus('error'); }
    return () => { clearTimeout(timeout); observer?.disconnect(); instance?.remove(); map.current = null; };
  }, [picker, onStatus]);
  useEffect(() => { if (map.current && themeRef.current !== theme) { themeRef.current = theme; map.current.setStyle(style(theme)); } }, [theme]);
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach(marker => marker.remove()); markers.current = [];
    const points = items.filter(item => item.point);
    for (const item of points) {
      const pin = document.createElement('button'); pin.type = 'button'; pin.className = `record-map-pin category-${item.category}`; pin.setAttribute('aria-label', `查看地点：${item.title}`); pin.textContent = item.rating == null ? '●' : Number(item.rating).toFixed(1);
      const content = document.createElement('div'), title = document.createElement('strong'), detail = document.createElement('p'), link = document.createElement('a'); title.textContent = item.title; detail.textContent = [item.placeName, item.city].filter(Boolean).join(' · '); link.href = hrefFor('records', item.slug); link.textContent = '阅读这条记录'; content.append(title, detail, link);
      const popup = new Popup({ offset: 22, closeButton: true }).setDOMContent(content);
      markers.current.push(new Marker({ element: pin }).setLngLat([item.point.lng, item.point.lat]).setPopup(popup).addTo(map.current));
    }
    if (points.length) { const bounds = new LngLatBounds(); points.forEach(item => bounds.extend([item.point.lng, item.point.lat])); map.current.fitBounds(bounds, { padding: 65, maxZoom: points.length === 1 ? 14 : 13, duration: 0 }); }
  }, [items]);
  useEffect(() => { if (!map.current || !pickedPoint) return; pointMarker.current?.remove(); pointMarker.current = new Marker({ color: '#6cad92' }).setLngLat([pickedPoint.lng, pickedPoint.lat]).addTo(map.current); }, [pickedPoint]);
  return <div ref={host} className="records-map-surface" />;
}
