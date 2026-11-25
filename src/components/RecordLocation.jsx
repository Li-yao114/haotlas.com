import React, { useMemo, useState } from 'react';
import RecordsMap from './RecordsMap';

export default function RecordLocation({ record }) {
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const points = useMemo(() => [record], [record]);
  const address = record.address ? [record.city && !record.address.includes(record.city) ? record.city : '', record.address].filter(Boolean).join(' · ') : (record.city || '');
  const copyText = [record.placeName, address].filter(Boolean).join('\n');
  const navigation = record.navigationUrl || (record.point ? `https://www.openstreetmap.org/?mlat=${record.point.lat}&mlon=${record.point.lng}#map=17/${record.point.lat}/${record.point.lng}` : null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(copyText); setStatus('地址已复制'); setManualCopy(false); }
    catch { setManualCopy(true); setStatus('请长按或选中文字复制'); }
  };
  if (!record.point && !copyText && !navigation) return null;
  return <section className="record-place-card" aria-label="地点与地址">
    {record.point && <div className="record-place-map"><RecordsMap items={points} /></div>}
    <div className="record-place-info"><h2>{record.placeName || '这次的位置'}</h2>{address && <p>{address}</p>}
      <div className="record-place-actions">{copyText && <button type="button" onClick={copy}>复制地址</button>}{navigation && <a href={navigation} target="_blank" rel="noreferrer">打开地图</a>}</div>
      {manualCopy && <textarea aria-label="可复制的地址" readOnly value={copyText} onFocus={event => event.target.select()} />}
      <span className="record-copy-status" role="status">{status}</span>
    </div>
  </section>;
}
