/**
 * フォームエラー表示用の汎用部品。`LoginPage`/`PostRecordModal`で完全に同一だった
 * エラーボックスのTailwindクラスをここに集約する。
 */
import type { ReactNode } from "react";

interface ErrorMessageProps {
  children: ReactNode;
}

export default function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p>
  );
}
