import React from "react";
import { useTheme, THEMES } from "./ThemeProvider";

const OPTIONS = [
  { value: THEMES.LIGHT, label: "Light", iconClass: "light" },
  { value: THEMES.DARK, label: "Dark", iconClass: "dark" },
  { value: THEMES.SYSTEM, label: "System", iconClass: "system" },
];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  const currentMode = theme === THEMES.SYSTEM ? resolvedTheme : theme;

  // 点击外部时收起菜单
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="theme-switcher" ref={containerRef}>
      <button
        type="button"
        className="theme-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="切换主题"
      >
        <span
          className={
            "theme-trigger-icon theme-trigger-icon-" + currentMode
          }
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="theme-menu">
          {OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className="theme-menu-item"
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
              >
                <span className="theme-menu-dot">
                  {active ? "●" : "○"}
                </span>
                <span
                  className={
                    "theme-option-icon theme-option-" + opt.iconClass
                  }
                  aria-hidden="true"
                />
                <span className="theme-option-label">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
