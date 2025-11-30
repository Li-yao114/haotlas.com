import React, { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    applyTheme(theme);
    const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    saveTheme(theme);

    if (theme === THEMES.SYSTEM && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const next = getSystemTheme();
        document.documentElement.setAttribute("data-theme", next);
        setResolvedTheme(next);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
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
