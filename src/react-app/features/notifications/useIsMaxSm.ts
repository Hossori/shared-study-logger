import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 639px)";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** Tailwind `sm` 未満（639px 以下）。SSR / 初回 hydration 前は false（デスクトップ Dialog）。 */
export function useIsMaxSm() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
