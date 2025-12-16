import React, { useEffect } from "react";
import "./Landing.css";

export default function Landing({ onEnter }) {
  useEffect(() => {
    const handleScrollOrTouch = (e) => {
      onEnter();
      e.preventDefault();
    };

    window.addEventListener("wheel", handleScrollOrTouch);
    window.addEventListener("touchmove", handleScrollOrTouch);
    return () => {
      window.removeEventListener("wheel", handleScrollOrTouch);
      window.removeEventListener("touchmove", handleScrollOrTouch);
    };
  }, [onEnter]);

  return (
    <div className="landing-root">
      <div className="landing-inner">
        <div className="landing-topbar">
          <div className="landing-logo">
            <span className="landing-logo-text">Haotlas</span>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="landing-center">
          <div className="landing-heading">
            <div className="landing-avatar" />
            <div className="landing-heading-text">
              <div className="landing-title">HAOTLAS</div>
              <div className="landing-subtitle">
                成为一个优秀的人！
              </div>
            </div>
          </div>
        </div>

        {/* 底部箭头 */}
        <button type="button" className="landing-arrow" onClick={onEnter}>
          <span className="landing-arrow-icon">⌄</span>
          <span className="landing-arrow-text">向下滑入</span>
        </button>
      </div>
    </div>
  );
}
