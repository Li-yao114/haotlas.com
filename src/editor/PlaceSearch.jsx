import React, { useRef, useState } from 'react';

const cache = new Map();
const cityCenters = new Map([['成都', { lng: 104.07, lat: 30.67 }], ['成都市', { lng: 104.07, lat: 30.67 }]]);
let lastSearch = 0;
export function photonPlaces(data) {
  return (data.features || []).flatMap(feature => {
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 85) return [];
    const p = feature.properties || {};
    return [{ id: `${p.osm_type || ''}${p.osm_id || `${lng},${lat}`}`, name: String(p.name || p.street || '地图位置'), city: String(p.city || p.county || ''), address: [...new Set([p.state, p.city, p.district, p.locality, p.street, p.housenumber].filter(Boolean))].join(''), point: { lng, lat } }];
  });
}

export default function PlaceSearch({ onSelect }) {
  const [city, setCity] = useState('成都'), [query, setQuery] = useState(''), [results, setResults] = useState([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const request = useRef(0);
  const search = async event => {
    event.preventDefault();
    if (busy || query.trim().length < 2) return;
    const key = `${city.trim()} ${query.trim()}`.trim(), id = ++request.current;
    setBusy(true); setMessage('正在查找地点…'); setResults([]);
    try {
      let values = cache.get(key);
      if (!values) {
        if (Date.now() - lastSearch < 1500) throw new Error('请稍等片刻再搜索。');
        lastSearch = Date.now();
        const configuration = await fetch('/admin/map-search.json').then(response => { if (!response.ok) throw new Error('地点搜索配置未能载入。'); return response.json(); });
        const url = new URL(configuration.photonEndpoint);
        if (url.protocol !== 'https:') throw new Error('地点搜索地址需要安全连接。');
        let center = cityCenters.get(city.trim());
        if (city.trim() && !center) {
          const cityUrl = new URL(configuration.photonEndpoint); cityUrl.search = new URLSearchParams({ q: city.trim(), limit: '1' }).toString();
          const cityResponse = await fetch(cityUrl, { signal: AbortSignal.timeout(15000) });
          if (cityResponse.ok) center = photonPlaces(await cityResponse.json())[0]?.point;
          if (center) cityCenters.set(city.trim(), center);
        }
        const parameters = { q: query.trim(), limit: '10' };
        if (center) { parameters.lat = String(center.lat); parameters.lon = String(center.lng); parameters.bbox = `${center.lng - 0.6},${center.lat - 0.45},${center.lng + 0.6},${center.lat + 0.45}`; }
        url.search = new URLSearchParams(parameters).toString();
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('地点搜索暂时不可用，可以先在地图上选点。');
        values = photonPlaces(await response.json()).slice(0, 6); cache.set(key, values);
      }
      if (request.current !== id) return;
      setResults(values); setMessage(values.length ? `找到 ${values.length} 个结果，请核对具体分店与地址。` : '没有找到匹配地点。可以换成街道或商场名称，再在地图上选点。');
    } catch (error) { if (request.current !== id) return; setMessage(error.name === 'TimeoutError' ? '搜索超时，可以先在地图上选点。' : error instanceof TypeError ? '暂时无法连接地点搜索，可以先在地图上选点。' : error.message); }
    finally { if (request.current === id) setBusy(false); }
  };
  return <div className="place-search"><form onSubmit={search}><label>城市<input value={city} onChange={event => setCity(event.target.value)} placeholder="成都" autoComplete="address-level2" /></label><label>店铺或地点<input value={query} onChange={event => { setQuery(event.target.value); request.current++; setResults([]); setMessage(''); setBusy(false); }} placeholder="输入店名、商场或地址" /></label><button disabled={busy || query.trim().length < 2} type="submit">{busy ? '查找中…' : '搜索地点'}</button></form><p className="place-search-status" role="status">{message || '输入后点击搜索；公开地图可能尚未收录部分门店，仍可手动选点。'}</p>{!!results.length && <ul>{results.map(place => <li key={place.id}><button type="button" onClick={() => { onSelect(place); setResults([]); setMessage(`已选择：${place.name}`); }}><strong>{place.name}</strong><span>{place.address || place.city || '请核对地图位置'}</span></button></li>)}</ul>}<p className="place-search-credit">地点搜索：<a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a> / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></p></div>;
}
