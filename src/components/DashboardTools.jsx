import React, { useEffect, useState } from 'react';
import CityMap from './CityMap';

const DURATION = 25 * 60;
const TIMER_KEY = 'haotlas-focus-timer';
const formatRemaining = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function FocusTimer() {
  const [remaining, setRemaining] = useState(DURATION);
  const [endsAt, setEndsAt] = useState(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
      if (!saved || !Number.isFinite(saved.remaining)) return;
      if (Number.isFinite(saved.endsAt)) {
        const next = Math.max(0, Math.min(DURATION, Math.ceil((saved.endsAt - Date.now()) / 1000)));
        setRemaining(next); setEndsAt(next ? saved.endsAt : null);
      } else setRemaining(Math.max(0, Math.min(DURATION, saved.remaining)));
    } catch { /* The timer also works when browser storage is unavailable. */ }
  }, []);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(next);
      if (!next) {
        setEndsAt(null);
        try { localStorage.setItem(TIMER_KEY, JSON.stringify({ remaining: 0, endsAt: null })); } catch { /* Optional persistence. */ }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const update = (seconds, deadline) => {
    setRemaining(seconds); setEndsAt(deadline);
    try { localStorage.setItem(TIMER_KEY, JSON.stringify({ remaining: seconds, endsAt: deadline })); } catch { /* Optional persistence. */ }
  };
  const toggle = () => {
    if (endsAt) update(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)), null);
    else { const seconds = remaining || DURATION; update(seconds, Date.now() + seconds * 1000); }
  };
  return <section className="dashboard-card dashboard-tool focus-tool" aria-labelledby="focus-heading"><h2 id="focus-heading">专注一会</h2><div className="dashboard-digits" role="timer" aria-label="专注剩余时间">{formatRemaining(remaining)}</div><p role="status">{remaining === 0 ? '这一段专注完成了，休息一下。' : endsAt ? '慢下来，一次只做一件事。' : '给当下留出 25 分钟。'}</p><div className="focus-actions"><button type="button" className="focus-primary" onClick={toggle}>{endsAt ? '暂停' : remaining === 0 ? '再来一次' : remaining < DURATION ? '继续' : '开始'}</button><button type="button" onClick={() => update(DURATION, null)} disabled={remaining === DURATION && !endsAt}>重置</button></div></section>;
}

function Clock() {
  const [now, setNow] = useState(null);
  useEffect(() => { const tick = () => setNow(new Date()); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);
  const date = now ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'long' }).format(now) : '把今天留给值得的事。';
  const time = now ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(now) : '--:--';
  return <section className="dashboard-card dashboard-tool clock-tool"><h2>此刻</h2><div className="dashboard-digits" aria-label="北京时间">{time}</div><p>{date}</p><span className="clock-zone">北京时间</span></section>;
}

export default function DashboardTools() {
  return <><CityMap /><Clock /><FocusTimer /></>;
}
