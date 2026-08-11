/**
 * Confirm ダイアログ用 Context / hook。
 *
 * @example
 * const confirm = useConfirm();
 * const ok = await confirm({
 *   title: "削除",
 *   message: "本当に削除しますか？",
 *   confirmLabel: "削除",
 *   variant: "danger",
 * });
 * if (!ok) return;
 */
import { createContext, useContext } from "react";
import type { ConfirmVariant } from "./ui/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return confirm;
}
