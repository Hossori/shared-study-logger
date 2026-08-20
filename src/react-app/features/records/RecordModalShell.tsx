/**
 * 学習記録の投稿/編集モーダル共通シェル（オーバーレイ・タイトル・フッター）。
 */
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogButtonArea,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";

interface RecordModalShellProps {
  open: boolean;
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
  open,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          {children}

          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}

          <DialogButtonArea>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {pendingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogButtonArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
