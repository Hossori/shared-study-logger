/**
 * ライト / ダークテーマ。明示選択は `localStorage` に保存し、`html` の `dark` クラスで切り替える。
 * 未保存時は `prefers-color-scheme` に従う。`index.html` の初期化スクリプトも同じキーを参照する。
 */
export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

/** `index.html` の `theme-color` 初期値と同じ。ブラウザ UI / PWA のバー色用 */
export const THEME_COLOR_HEX: Record<Theme, string> = {
  light: "#f4f7f8",
  dark: "#1c252d",
};

export type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

export type ThemeRoot = {
  classList: {
    toggle(token: string, force?: boolean): unknown;
  };
};

export type ThemeColorMeta = {
  setAttribute(name: string, value: string): void;
};

export function parseStoredTheme(value: string | null): Theme | null {
  if (value === "dark" || value === "light") return value;
  return null;
}

export function readStoredTheme(storage?: ThemeStorage): Theme | null {
  try {
    const store = storage ?? localStorage;
    return parseStoredTheme(store.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function readPreferredTheme(isDarkPreferred?: () => boolean): Theme {
  try {
    const prefersDark = (
      isDarkPreferred ??
      (() => window.matchMedia("(prefers-color-scheme: dark)").matches)
    )();
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function resolveTheme(stored: Theme | null, preferred: Theme): Theme {
  return stored ?? preferred;
}

export function readResolvedTheme(
  storage?: ThemeStorage,
  isDarkPreferred?: () => boolean,
): Theme {
  return resolveTheme(
    readStoredTheme(storage),
    readPreferredTheme(isDarkPreferred),
  );
}

export function persistTheme(theme: Theme, storage?: ThemeStorage): void {
  try {
    const store = storage ?? localStorage;
    store.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // プライベートモード等で失敗しても、セッション内の見た目は切り替えられる
  }
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export function applyThemeClass(theme: Theme, root: ThemeRoot): void {
  root.classList.toggle("dark", theme === "dark");
}

export function applyThemeColor(
  theme: Theme,
  meta?: ThemeColorMeta | null,
): void {
  const el =
    meta ??
    (typeof document === "undefined"
      ? null
      : document.querySelector('meta[name="theme-color"]'));
  el?.setAttribute("content", THEME_COLOR_HEX[theme]);
}
