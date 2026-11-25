import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import ThemeToggle from '../components/theme/ThemeToggle';
import RecordsMap from '../components/RecordsMap';
import PlaceSearch from './PlaceSearch';
import '../index.css';
import './location.css';
function Picker() {
  const [point, setPoint] = useState(null), [copied, setCopied] = useState(false), [place, setPlace] = useState(null);
  const items = useMemo(() => [], []);
  const coordinates = point ? `${point.lng.toFixed(6)},${point.lat.toFixed(6)}` : '';
  const copy = async () => { try { await navigator.clipboard.writeText(coordinates); setCopied(true); } catch { document.getElementById('picked-coordinates').select(); setCopied(false); } };
  return <ThemeProvider><main className="location-editor"><header><a className="wordmark" href="/admin/">Haotlas</a><ThemeToggle /></header><h1>把这个地方留下来。</h1><p>移动、缩放地图，点击店铺或地点的位置，再把坐标粘贴到记录编辑器的“地图位置”。</p><PlaceSearch onSelect={value => { setPlace(value); setPoint(value.point); setCopied(false); }} />{place && <p>已选地点：{place.name} · {place.address || place.city}</p>}<RecordsMap items={items} focusPoint={place?.point} picker onPointPick={value => { setPoint(value); setCopied(false); }} pickedPoint={point} /><div className="location-copy"><label htmlFor="picked-coordinates">地图位置</label><input id="picked-coordinates" readOnly value={coordinates} placeholder="请先在地图上选一个位置" /><button type="button" disabled={!point} onClick={copy}>{copied ? '已复制' : '复制坐标'}</button></div><p className="location-helper" role="status">{copied ? '回到编辑器，粘贴到“地图位置”即可。' : '手机上使用双指移动和缩放；这是你主动选择的地点，不会自动读取设备定位。'}</p><a className="text-link" href="https://app.pagescms.org/Li-yao114/haotlas.com/main/collection/records">打开记录编辑器</a></main></ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<Picker />);
