import React from "react";
import ThemeToggle from "../theme/ThemeToggle";
import "./Header.css";

const NAV_ITEMS = [
  { id: "home", label: "主页" },
  { id: "writing", label: "文稿" },
  { id: "photography", label: "摄影" },
  { id: "about", label: "关于" },
];

export default function Header({ currentPage, onChangePage, onBackLanding }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* 左上角：点击返回进站页 */}
        <div
          className="site-logo site-logo-clickable"
          onClick={onBackLanding}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onBackLanding?.();
          }}
          aria-label="返回进站页"
        >
          <span className="site-logo-text">Haotlas</span>
        </div>

        <nav className="site-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                "site-nav-item" +
                (currentPage === item.id ? " site-nav-item-active" : "")
              }
              onClick={() => onChangePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* 右侧动作区 */}
        <div className="site-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
