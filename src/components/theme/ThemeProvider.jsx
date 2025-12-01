import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  THEMES,
  getInitialTheme,
  getSystemTheme,
  applyTheme,
  saveTheme,
} from "../../lib/theme";

const ThemeContext = createContext({
  theme: THEMES.SYSTEM,
  resolvedTheme: THEMES.LIGHT,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === THEMES.SYSTEM ? getSystemTheme() : theme
  );

  // 主题变化时应用到 DOM
  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(theme === THEMES.SYSTEM ? getSystemTheme() : theme);
    saveTheme(theme);
  }, [theme]);

  // 监听系统主题变化（在 SYSTEM 模式下生效）
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM);
        setResolvedTheme(getSystemTheme());
      }
    };

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (mode) => {
    setThemeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES };
