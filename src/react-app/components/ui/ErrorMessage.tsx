/**
 * フォーム全体のエラー表示。見た目は shadcn の Alert に委譲する。
 */
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorMessageProps {
  children: ReactNode;
}

export default function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
