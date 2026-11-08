import { useLayoutEffect } from "react";
import {
  isTextEntryElement,
  keyboardOverlapPx,
  shellFrame,
} from "./visualViewportFrame";

function textEntryFocused(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  const inputType = el instanceof HTMLInputElement ? el.type : null;
  return isTextEntryElement(el.tagName, inputType, el.isContentEditable);
}

function applyKeyboardOverlap() {
  const vv = window.visualViewport;
  const overlap = keyboardOverlapPx(
    window.innerHeight,
    vv?.height ?? null,
    vv?.offsetTop ?? 0,
  );
  const visualHeight =
    vv?.height != null && vv.height > 0 ? vv.height : window.innerHeight;
  const root = document.documentElement;
  root.style.setProperty("--keyboard-overlap", `${overlap}px`);
  root.style.setProperty("--visual-height", `${visualHeight}px`);
}

function applyShell(widthDelta: number | null) {
  const vv = window.visualViewport;
  const frame = shellFrame({
    visualHeight: vv?.height ?? null,
    innerHeight: window.innerHeight,
    scrollY: window.scrollY,
    textEntryFocused: textEntryFocused(),
    widthDelta,
  });
  if (frame.heightPx != null) {
    document.documentElement.style.setProperty(
      "--app-height",
      `${frame.heightPx}px`,
    );
  }
  if (frame.resetScroll) {
    window.scrollTo(0, 0);
  }
}

export function useVisualViewportFrame() {
  useLayoutEffect(() => {
    let lastWidth = window.visualViewport?.width ?? window.innerWidth;
    document.body.style.removeProperty("transform");

    const syncShell = (force: boolean) => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const widthDelta = force ? null : width - lastWidth;
      lastWidth = width;
      applyKeyboardOverlap();
      applyShell(widthDelta);
    };

    syncShell(true);
    const onResize = () => syncShell(false);
    const onOrientation = () => syncShell(true);
    const onScroll = () => {
      applyKeyboardOverlap();
      const vv = window.visualViewport;
      const keyboardLikely = vv != null && window.innerHeight - vv.height > 80;
      if (!textEntryFocused() && !keyboardLikely && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);
}
