/**
 * iOS で縦横が切り替わったあと、viewport を再設定して window のスクロールを戻す。
 * 向きの固定はしない。詳細は docs/design-decisions.md。
 */
import { useEffect } from "react";
import { isIosClient } from "@/lib/iosStandalone";
import {
  orientationKindFromSignals,
  viewportContentForResettle,
  type OrientationKind,
} from "@/lib/orientationViewport";

export function useIosOrientationViewport() {
  useEffect(() => {
    if (!isIosClient()) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!(meta instanceof HTMLMetaElement)) return;

    const base = meta.getAttribute("content") ?? "";
    const currentKind = (): OrientationKind =>
      orientationKindFromSignals({
        width: window.innerWidth,
        height: window.innerHeight,
        screenOrientationType: window.screen.orientation?.type,
        windowOrientation: (window as Window & { orientation?: number })
          .orientation,
      });
    let kind = currentKind();
    let frame = 0;

    const settle = () => {
      window.scrollTo(0, 0);
      const { bumped, restored } = viewportContentForResettle(base);
      meta.setAttribute("content", bumped);
      const root = document.getElementById("root");
      if (root) {
        const previous = root.style.transform;
        root.style.transform = "translateZ(0)";
        void root.offsetHeight;
        root.style.transform = previous;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        meta.setAttribute("content", restored);
        window.scrollTo(0, 0);
      });
    };

    const applyIfChanged = () => {
      const next = currentKind();
      if (next === kind) return false;
      kind = next;
      settle();
      return true;
    };

    // orientationchange は幅や window.orientation が更新される前に来ることがある。
    const onChange = () => {
      if (applyIfChanged()) return;
      requestAnimationFrame(() => {
        if (applyIfChanged()) return;
        requestAnimationFrame(() => {
          applyIfChanged();
        });
      });
    };

    window.addEventListener("orientationchange", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("orientationchange", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);
}
