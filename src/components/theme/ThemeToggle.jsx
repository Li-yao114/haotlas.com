import React from "react";
import { useTheme, THEMES } from "./ThemeProvider";

const OPTIONS = [
  { value: THEMES.LIGHT, icon: "☀️", label: "Light" },
  { value: THEMES.DARK, icon: "🌙", label: "Dark" },
  { value: THEMES.SYSTEM, icon: "💻", label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" aria-label="Theme switcher">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`theme-toggle-btn ${active ? "is-active" : ""}`}
            onClick={() => setTheme(opt.value)}
          >
            <span className="theme-icon" aria-hidden="true">
              {opt.icon}
            </span>
            <span className="theme-text">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
