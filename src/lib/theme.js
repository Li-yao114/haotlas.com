const THEME_KEY = "haotlas-theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return THEMES.LIGHT;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

export function getInitialTheme() {
  if (typeof window === "undefined") return THEMES.LIGHT;

  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }

  return THEMES.SYSTEM; // 默认跟随系统
}

export function applyTheme(mode) {
  const root = document.documentElement;
  const resolved = mode === THEMES.SYSTEM ? getSystemTheme() : mode;
  root.setAttribute("data-theme", resolved);
}

export function saveTheme(mode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // ignore
  }
}
