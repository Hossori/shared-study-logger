/**
 * 認証状態の判定中など、画面全体をブロックするローディング表示。
 * ルートガード（`routes/ProtectedRoute.tsx`, `routes/GuestRoute.tsx`）で共通利用する。
 */
export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-400">読み込み中...</p>
    </div>
  );
}
