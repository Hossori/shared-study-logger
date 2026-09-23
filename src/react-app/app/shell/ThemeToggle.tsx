/**
 * ライト / ダーク切替。未保存時は OS の `prefers-color-scheme` に追従し、
 * 押下後は `localStorage` に明示テーマを保存する。
 */
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextTheme } from "@/lib/theme";
import { usePreferencesStore } from "@/stores/preferencesStore";

export default function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme);
  const setExplicitTheme = usePreferencesStore(
    (state) => state.setExplicitTheme,
  );
  const label =
    theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え";

  return (
    <Button
      type="button"
      size="icon-lg"
      variant="outline"
      className="rounded-full"
      aria-label={label}
      onClick={() => {
        setExplicitTheme(nextTheme(theme));
      }}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
