/**
 * 確認モーダルの見た目。オーバーレイクリック / Escape でキャンセル扱い。
 * 開閉状態と結果の受け渡しは ConfirmProvider / useConfirm 側が担う。
 */
import { useEffect, useId, useRef } from "react";
import Button from "./Button";

export type ConfirmVariant = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const overlayClassName =
  "fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center";
const panelClassName =
  "w-full rounded-t-2xl bg-white p-5 shadow-xl sm:mx-4 sm:max-w-sm sm:rounded-2xl sm:p-6";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={overlayClassName} onClick={onCancel} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-bold text-gray-900">
          {title}
        </h2>
        <p
          id={messageId}
          className="mt-2 text-sm whitespace-pre-wrap text-gray-600"
        >
          {message}
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            onClick={onCancel}
            className="flex-1 py-2.5"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            className="flex-1 py-2.5"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
