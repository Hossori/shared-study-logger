/**
 * 存在しないパスにアクセスした場合の404画面。
 */
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-muted-foreground text-6xl font-bold">404</p>
      <h1 className="text-xl font-semibold">ページが見つかりません</h1>
      <p className="text-muted-foreground text-sm">
        お探しのページは移動または削除された可能性があります。
      </p>
      <Button render={<Link to="/" />} nativeButton={false}>
        トップへ戻る
      </Button>
    </div>
  );
}
