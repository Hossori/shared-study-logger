/**
 * 認証状態の判定中など、画面全体をブロックするローディング表示。
 * ルートガード（`routes/ProtectedRoute.tsx`, `routes/GuestRoute.tsx`）で共通利用する。
 */
import { Spinner } from "@/components/ui/spinner";

export default function LoadingScreen() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner />
        読み込み中...
      </p>
    </div>
  );
}
