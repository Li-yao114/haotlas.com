const THEME_KEY = "haotlas-theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export function getSystemTheme() {
  if (typeof window === "undefined") return THEMES.LIGHT;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

export function getInitialTheme() {
  if (typeof window === "undefined") return THEMES.LIGHT;
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === THEMES.LIGHT || saved === THEMES.DARK || saved === THEMES.SYSTEM) {
    return saved;
  }
  return THEMES.SYSTEM;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
  root.setAttribute("data-theme", resolved);
}

export function saveTheme(theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}
