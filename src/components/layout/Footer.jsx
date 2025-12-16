import React, { useEffect, useState } from "react";
import "./Footer.css";

const LAUNCH_DATE = new Date("2023-10-31 21:15:09");

function formatDuration(ms) {
  if (ms <= 0) return "0 天 0 小时 0 分钟 0 秒";

  let totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${days} 天 ${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
}

export default function Footer() {
  const [runtime, setRuntime] = useState(() =>
    formatDuration(Date.now() - LAUNCH_DATE.getTime())
  );

  useEffect(() => {
    const tick = () => {
      setRuntime(formatDuration(Date.now() - LAUNCH_DATE.getTime()));
    };

    tick();
    // 每秒更新
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-line" />
      <div className="footer-text">
        <span>© {year} Designed By Haotlas · </span>
        <span className="footer-rocket" role="img" aria-label="rocket">
          🚀
        </span>
        <span>本站已运行 {runtime}</span>
      </div>
    </footer>
  );
}
