import { useLayoutEffect } from "react";
import { visualViewportFrame } from "./visualViewportFrame";

function applyVisualViewportFrame() {
  const { heightPx, resetScroll } = visualViewportFrame(
    window.visualViewport?.height ?? null,
    window.innerHeight,
    window.scrollY,
  );
  document.documentElement.style.setProperty("--app-height", `${heightPx}px`);
  if (resetScroll) {
    window.scrollTo(0, 0);
  }
}

export function useVisualViewportFrame() {
  useLayoutEffect(() => {
    applyVisualViewportFrame();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", applyVisualViewportFrame);
    vv?.addEventListener("scroll", applyVisualViewportFrame);
    window.addEventListener("resize", applyVisualViewportFrame);
    window.addEventListener("orientationchange", applyVisualViewportFrame);
    return () => {
      vv?.removeEventListener("resize", applyVisualViewportFrame);
      vv?.removeEventListener("scroll", applyVisualViewportFrame);
      window.removeEventListener("resize", applyVisualViewportFrame);
      window.removeEventListener("orientationchange", applyVisualViewportFrame);
    };
  }, []);
}
