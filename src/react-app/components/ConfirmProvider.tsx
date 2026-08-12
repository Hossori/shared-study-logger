/**
 * Promise ベースの確認ダイアログ。
 * Context・Promise 解決などの副作用を持つため `components/ui/` ではなく直下に置く。
 * 見た目は純粋 UI の `ui/ConfirmDialog` を使う。
 * Context / hook は `useConfirm.ts`。
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmDialog, { type ConfirmVariant } from "./ui/ConfirmDialog";
import {
  ConfirmContext,
  type ConfirmFn,
  type ConfirmOptions,
} from "./useConfirm";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
}

const defaultState: ConfirmState = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "OK",
  cancelLabel: "キャンセル",
  variant: "default",
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(defaultState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeWith = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
    // ダイアログ内フォーカス移動前に保存した要素へ戻す
    const el = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    queueMicrotask(() => el?.focus?.());
  }, []);

  // Provider アンマウント時に未解決 Promise が残らないようにする
  useEffect(() => {
    return () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
      previouslyFocusedRef.current = null;
    };
  }, []);

  const confirm = useCallback<ConfirmFn>((options: ConfirmOptions) => {
    // 連打などで前の確認が残っていたらキャンセル扱いで解決する
    const replacing = resolveRef.current !== null;
    resolveRef.current?.(false);
    // 差し替え時はダイアログ内のボタンを opener にしない
    if (!replacing) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
    }
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? "OK",
        cancelLabel: options.cancelLabel ?? "キャンセル",
        variant: options.variant ?? "default",
      });
    });
  }, []);

  const onConfirm = useCallback(() => closeWith(true), [closeWith]);
  const onCancel = useCallback(() => closeWith(false), [closeWith]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </ConfirmContext.Provider>
  );
}
