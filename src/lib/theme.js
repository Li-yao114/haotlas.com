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
  if (typeof window === "undefined") {
    return THEMES.DARK;
  }
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (
      saved === THEMES.LIGHT ||
      saved === THEMES.DARK ||
      saved === THEMES.SYSTEM
    ) {
      return saved;
    }
  } catch {
    // ignore
  }
  return THEMES.DARK;
}

export function applyTheme(mode) {
  const root = document.documentElement;
  const resolved = mode === THEMES.SYSTEM ? getSystemTheme() : mode;

  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved === THEMES.DARK ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === THEMES.DARK ? '#0b0c0d' : '#f5f5f2');
}

export function saveTheme(mode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, mode);
  } catch {
    // ignore
  }
}
