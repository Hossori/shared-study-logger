/**
 * Layout の本文スクロール容器。PullToRefresh は祖先探索せずここから ref を受け取る。
 */
import { createContext, useContext, type RefObject } from "react";

export type LayoutScrollContextValue = {
  scrollRef: RefObject<HTMLElement | null>;
  setPullToRefreshActive: (active: boolean) => void;
};

export const LayoutScrollContext =
  createContext<LayoutScrollContextValue | null>(null);

export function useLayoutScroll(): LayoutScrollContextValue {
  const value = useContext(LayoutScrollContext);
  if (!value) {
    throw new Error("useLayoutScroll must be used within Layout");
  }
  return value;
}
