/**
 * フォームダイアログ向けの未保存クローズガード。
 * 確認 UI は親 Dialog の子として描画し、Base UI の入れ子ダイアログとして扱う。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
  resolveUnsavedCloseRequest,
  UNSAVED_CLOSE_CONFIRM,
} from "../lib/unsavedCloseGuard";

interface CloseEventDetails {
  cancel: () => void;
}

export function useUnsavedCloseGuard(open: boolean, onClose: () => void) {
  const dirtyRef = useRef(false);
  const confirmingRef = useRef(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    setConfirmOpen(false);
  }

  useEffect(() => {
    if (open) {
      dirtyRef.current = false;
      return;
    }
    confirmingRef.current = false;
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, [open]);

  useEffect(() => {
    return () => {
      resolveRef.current?.(false);
      resolveRef.current = null;
    };
  }, []);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const finishConfirm = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setConfirmOpen(false);
  }, []);

  const requestClose = useCallback(
    async (eventDetails?: CloseEventDetails) => {
      const decision = resolveUnsavedCloseRequest({
        dirty: dirtyRef.current,
        confirming: confirmingRef.current,
      });

      if (decision === "ignore") {
        eventDetails?.cancel();
        return;
      }

      if (decision === "confirm") {
        eventDetails?.cancel();
        confirmingRef.current = true;
        setConfirmOpen(true);
        const ok = await new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
        confirmingRef.current = false;
        if (!ok) return;
      }

      dirtyRef.current = false;
      onClose();
    },
    [onClose],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean, eventDetails: CloseEventDetails) => {
      if (nextOpen) return;
      void requestClose(eventDetails);
    },
    [requestClose],
  );

  const confirmNode: ReactNode = (
    <ConfirmDialog
      open={open && confirmOpen}
      title={UNSAVED_CLOSE_CONFIRM.title}
      message={UNSAVED_CLOSE_CONFIRM.message}
      confirmLabel={UNSAVED_CLOSE_CONFIRM.confirmLabel}
      cancelLabel={UNSAVED_CLOSE_CONFIRM.cancelLabel}
      variant={UNSAVED_CLOSE_CONFIRM.variant}
      onConfirm={() => finishConfirm(true)}
      onCancel={() => finishConfirm(false)}
    />
  );

  return {
    markDirty,
    requestClose: () => {
      void requestClose();
    },
    handleOpenChange,
    formGuardProps: {
      onInput: markDirty,
      onChange: markDirty,
    },
    confirmNode,
  };
}
