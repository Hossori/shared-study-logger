/**
 * 認証状態の取得失敗など、画面全体をブロックするエラー表示。
 */
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface ErrorScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function ErrorScreen({ onRetry, isRetrying }: ErrorScreenProps) {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">読み込みに失敗しました</p>
        <Button type="button" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? (
            <>
              <Spinner data-icon="inline-start" />
              再試行中...
            </>
          ) : (
            "再試行"
          )}
        </Button>
      </div>
    </div>
  );
}
