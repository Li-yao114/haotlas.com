import React from "react";
import { useTheme, THEMES } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const btnStyle = (value) => ({
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid var(--border-subtle)",
    fontSize: 12,
    cursor: "pointer",
    background:
      theme === value ? "var(--accent)" : "rgba(0,0,0,0)",
    color: theme === value ? "#fff" : "var(--text-secondary)",
  });

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button style={btnStyle(THEMES.LIGHT)} onClick={() => setTheme(THEMES.LIGHT)}>
        Light
      </button>
      <button style={btnStyle(THEMES.DARK)} onClick={() => setTheme(THEMES.DARK)}>
        Dark
      </button>
      <button style={btnStyle(THEMES.SYSTEM)} onClick={() => setTheme(THEMES.SYSTEM)}>
        System
      </button>
    </div>
  );
}
