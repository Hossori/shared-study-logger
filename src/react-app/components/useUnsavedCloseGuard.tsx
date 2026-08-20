/**
 * フォームダイアログ向けの未保存クローズガード。
 * 確認 UI は親 Dialog の子として描画し、Base UI の入れ子ダイアログとして扱う。
 * 確認は AlertDialog（中央・fade/zoom）にし、Portal は document.body へ出して
 * 親 Popup の transform / overflow によるクリップを避ける。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  resolveUnsavedCloseRequest,
  UNSAVED_CLOSE_CONFIRM,
} from "@/lib/unsavedCloseGuard";

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
    <AlertDialog
      open={open && confirmOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) finishConfirm(false);
      }}
    >
      <AlertDialogContent
        container={typeof document === "undefined" ? undefined : document.body}
        overlay={{ forceRender: true }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{UNSAVED_CLOSE_CONFIRM.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {UNSAVED_CLOSE_CONFIRM.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {UNSAVED_CLOSE_CONFIRM.cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={() => finishConfirm(true)}
          >
            {UNSAVED_CLOSE_CONFIRM.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
