import React, { createContext, useContext, useEffect, useState } from "react";
import { THEMES, getInitialTheme, applyTheme, saveTheme, getSystemTheme } from "../../lib/theme";

const ThemeContext = createContext({
  theme: THEMES.SYSTEM,
  resolvedTheme: THEMES.LIGHT,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(THEMES.LIGHT);

  useEffect(() => {
    const sys = getInitialTheme() === THEMES.SYSTEM ? getSystemTheme() : null;
    const effective = theme === THEMES.SYSTEM ? (sys || THEMES.LIGHT) : theme;

    applyTheme(theme);
    setResolvedTheme(effective);
    saveTheme(theme);

    // 监听系统主题变化（当 theme === system 时生效）
    if (theme === THEMES.SYSTEM && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => {
        applyTheme(THEMES.SYSTEM);
        setResolvedTheme(getSystemTheme());
      };
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
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
