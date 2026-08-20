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
  event?: Event;
  reason?: string;
}

const UNSAVED_CLOSE_DEBUG_PARAM = "unsavedCloseDebug";

function isUnsavedCloseDebugEnabled() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get(
      UNSAVED_CLOSE_DEBUG_PARAM,
    ) === "1"
  );
}

function describeEventTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  return {
    tagName: target.tagName,
    id: target.id || null,
    name: target.getAttribute("name"),
    role: target.getAttribute("role"),
    slot: target.getAttribute("data-slot"),
    text: target.textContent?.trim().slice(0, 80) || null,
  };
}

export function useUnsavedCloseGuard(open: boolean, onClose: () => void) {
  const dirtyRef = useRef(false);
  const confirmingRef = useRef(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const debugEnabledRef = useRef(isUnsavedCloseDebugEnabled());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const debug = useCallback(
    (message: string, details: Record<string, unknown> = {}) => {
      if (!debugEnabledRef.current) return;

      console.info("[unsaved-close-debug]", {
        time: Math.round(performance.now()),
        message,
        ...details,
      });
    },
    [],
  );

  if (open !== prevOpen) {
    setPrevOpen(open);
    setConfirmOpen(false);
  }

  useEffect(() => {
    if (open) {
      dirtyRef.current = false;
      debug("dialog opened; dirty state reset");
      return;
    }
    debug("dialog closed; pending confirmation reset");
    confirmingRef.current = false;
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, [debug, open]);

  useEffect(() => {
    return () => {
      debug("guard unmounted");
      resolveRef.current?.(false);
      resolveRef.current = null;
    };
  }, [debug]);

  useEffect(() => {
    if (!debugEnabledRef.current || !open) return;

    const logCapturedEvent = (event: Event) => {
      const point =
        event instanceof MouseEvent
          ? document.elementFromPoint(event.clientX, event.clientY)
          : null;

      debug("captured document event", {
        eventType: event.type,
        key:
          event instanceof KeyboardEvent && event.key === "Escape"
            ? "Escape"
            : null,
        target: describeEventTarget(event.target),
        hitTarget: describeEventTarget(point),
      });
    };

    document.addEventListener("pointerdown", logCapturedEvent, true);
    document.addEventListener("click", logCapturedEvent, true);
    document.addEventListener("keydown", logCapturedEvent, true);

    return () => {
      document.removeEventListener("pointerdown", logCapturedEvent, true);
      document.removeEventListener("click", logCapturedEvent, true);
      document.removeEventListener("keydown", logCapturedEvent, true);
    };
  }, [debug, open]);

  useEffect(() => {
    debug("confirmation state changed", {
      confirmOpen,
      dirty: dirtyRef.current,
      confirming: confirmingRef.current,
    });
  }, [confirmOpen, debug]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    debug("form marked dirty");
  }, [debug]);

  const finishConfirm = useCallback(
    (value: boolean) => {
      debug("confirmation finished", { value });
      resolveRef.current?.(value);
      resolveRef.current = null;
      setConfirmOpen(false);
    },
    [debug],
  );

  const requestClose = useCallback(
    async (eventDetails?: CloseEventDetails) => {
      const decision = resolveUnsavedCloseRequest({
        dirty: dirtyRef.current,
        confirming: confirmingRef.current,
      });
      debug("close requested", {
        decision,
        dirty: dirtyRef.current,
        confirming: confirmingRef.current,
        reason: eventDetails?.reason ?? "direct-button",
        target: describeEventTarget(eventDetails?.event?.target ?? null),
      });

      if (decision === "ignore") {
        eventDetails?.cancel();
        debug("close request ignored while confirmation is open");
        return;
      }

      if (decision === "confirm") {
        eventDetails?.cancel();
        confirmingRef.current = true;
        setConfirmOpen(true);
        debug("confirmation opening");
        const ok = await new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
        confirmingRef.current = false;
        if (!ok) {
          debug("close cancelled after confirmation");
          return;
        }
      }

      dirtyRef.current = false;
      debug("form close accepted");
      onClose();
    },
    [debug, onClose],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean, eventDetails: CloseEventDetails) => {
      debug("parent dialog open change", {
        nextOpen,
        reason: eventDetails.reason ?? null,
        target: describeEventTarget(eventDetails.event?.target ?? null),
      });
      if (nextOpen) return;
      void requestClose(eventDetails);
    },
    [debug, requestClose],
  );

  const confirmNode: ReactNode = (
    <AlertDialog
      open={open && confirmOpen}
      onOpenChange={(nextOpen, eventDetails) => {
        debug("confirmation open change", {
          nextOpen,
          reason: eventDetails.reason,
          target: describeEventTarget(eventDetails.event.target),
        });
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
