/**
 * ライト / ダーク切替。未保存時は OS の `prefers-color-scheme` に追従し、
 * 押下後は `localStorage` に明示テーマを保存する。
 */
import { useEffect, useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyThemeClass,
  applyThemeColor,
  nextTheme,
  persistTheme,
  readResolvedTheme,
  readStoredTheme,
  type Theme,
} from "../lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readResolvedTheme());
  const [followsSystem, setFollowsSystem] = useState(
    () => readStoredTheme() == null,
  );

  useLayoutEffect(() => {
    applyThemeClass(theme, document.documentElement);
    applyThemeColor(theme);
  }, [theme]);

  useEffect(() => {
    if (!followsSystem) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setTheme(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [followsSystem]);

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
        const next = nextTheme(theme);
        persistTheme(next);
        setFollowsSystem(false);
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
