/**
 * フォームダイアログを閉じるときの未保存確認。
 * 「初期値と違う」ではなく、一度でも値を編集したかどうかで判定する。
 */

export const UNSAVED_CLOSE_CONFIRM = {
  title: "編集内容を破棄しますか？",
  message: "入力した内容は保存されません。",
  confirmLabel: "破棄する",
  cancelLabel: "編集に戻る",
  variant: "danger" as const,
};

export type UnsavedCloseDecision = "close" | "confirm" | "ignore";

export function resolveUnsavedCloseRequest(state: {
  dirty: boolean;
  confirming: boolean;
}): UnsavedCloseDecision {
  if (state.confirming) return "ignore";
  if (state.dirty) return "confirm";
  return "close";
}
