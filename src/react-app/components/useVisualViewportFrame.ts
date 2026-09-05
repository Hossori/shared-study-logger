import { useCallback, useLayoutEffect, useRef } from "react";
import { getVisualViewportFrame } from "@/lib/visualViewport";

const CSS_VARS = [
  "--vv-top",
  "--vv-left",
  "--vv-height",
  "--vv-width",
  "--keyboard-inset",
] as const;

function applyVisualViewportFrame(el: HTMLElement) {
  const frame = getVisualViewportFrame(
    { innerHeight: window.innerHeight, innerWidth: window.innerWidth },
    window.visualViewport,
  );
  el.style.setProperty("--vv-top", `${frame.top}px`);
  el.style.setProperty("--vv-left", `${frame.left}px`);
  el.style.setProperty("--vv-height", `${frame.height}px`);
  el.style.setProperty("--vv-width", `${frame.width}px`);
  el.style.setProperty("--keyboard-inset", `${frame.keyboardInset}px`);
}

function clearVisualViewportFrame(el: HTMLElement) {
  for (const name of CSS_VARS) {
    el.style.removeProperty(name);
  }
}

export function useVisualViewportFrame() {
  const elRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      if (elRef.current) {
        applyVisualViewportFrame(elRef.current);
      }
    };

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", sync);
    visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    sync();

    return () => {
      visualViewport?.removeEventListener("resize", sync);
      visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      if (elRef.current) {
        clearVisualViewportFrame(elRef.current);
      }
    };
  }, []);

  return useCallback((el: HTMLElement | null) => {
    elRef.current = el;
    if (el && typeof window !== "undefined") {
      applyVisualViewportFrame(el);
    }
  }, []);
}
