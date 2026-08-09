/**
 * 存在しないパスにアクセスした場合の404画面。
 */
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
      <p className="text-6xl font-bold text-gray-300">404</p>
      <h1 className="text-xl font-semibold text-gray-900">
        ページが見つかりません
      </h1>
      <p className="text-sm text-gray-500">
        お探しのページは移動または削除された可能性があります。
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
