import React from "react";

export default function Landing({ onEnter }) {
  return (
    <div className="landing-root">
      <div className="landing-inner">
        {/* 顶部：只保留左上 logo，不要主题切换 */}
        <div className="landing-topbar">
          <div className="landing-logo">
            <div className="landing-logo-mark">🎈</div>
            <span className="landing-logo-text">Haotlas</span>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="landing-center">
          <div className="landing-badge">WELCOME</div>

          {/* 头像 + 标题一行，类似养鸡场 */}
          <div className="landing-heading">
            <div className="landing-avatar" />
            <div className="landing-heading-text">
              <div className="landing-title">HAOTLAS</div>
              <div className="landing-subtitle">
                记录一些文稿、摄影和代码。
              </div>
            </div>
          </div>

          <button type="button" className="landing-cta" onClick={onEnter}>
            进入站点
          </button>
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