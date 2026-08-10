/**
 * 学習記録の投稿/編集モーダル共通シェル（オーバーレイ・タイトル・フッター）。
 */
import type { FormEvent, ReactNode } from "react";
import Button from "../../components/ui/Button";
import ErrorMessage from "../../components/ui/ErrorMessage";

const overlayClassName =
  "fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center";
const panelClassName =
  "max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6";
const closeButtonClassName =
  "rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600";

interface RecordModalShellProps {
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errorMessage: string | null;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  children: ReactNode;
}

export default function RecordModalShell({
  title,
  onClose,
  onSubmit,
  errorMessage,
  isPending,
  submitLabel,
  pendingLabel,
  children,
}: RecordModalShellProps) {
  return (
    <div className={overlayClassName} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={panelClassName}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={closeButtonClassName}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-2.5"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5"
            >
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
