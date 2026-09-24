/**
 * アプリ全体の設定。正本は localStorage。未保存のテーマは OS の prefers-color-scheme。
 * 初回描画前のクラス付与は index.html。ここは同じ解決結果で初期化する。
 */
import { create } from "zustand";
import {
  applyThemeClass,
  applyThemeColor,
  persistTheme,
  readPreferredTheme,
  readResolvedTheme,
  readStoredTheme,
  type Theme,
} from "@/lib/theme";

interface PreferencesState {
  /** 画面に出している解決済みテーマ */
  theme: Theme;
  /** localStorage の明示値。null は OS 追従 */
  explicit: Theme | null;
  setExplicitTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  applyThemeClass(theme, document.documentElement);
  applyThemeColor(theme);
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: readResolvedTheme(),
  explicit: readStoredTheme(),
  setExplicitTheme: (theme) => {
    persistTheme(theme);
    applyTheme(theme);
    set({ theme, explicit: theme });
  },
}));

function subscribeSystemTheme() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return;
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (usePreferencesStore.getState().explicit != null) return;
    const theme = readPreferredTheme(() => media.matches);
    applyTheme(theme);
    usePreferencesStore.setState({ theme });
  };
  media.addEventListener("change", onChange);
}

subscribeSystemTheme();
