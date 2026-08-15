/**
 * マイページ用の Push 通知設定カード。
 * enable / disable はユーザー操作（Switch）から呼び、ページロード時には許可を求めない。
 */
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useNotificationOptIn } from "./useNotificationOptIn";

export default function PushSettingsCard() {
  const { status, error, isPending, enable, disable } = useNotificationOptIn();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push 通知</CardTitle>
        <CardDescription>
          グループメンバーの学習記録を受け取れます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "checking" ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-[18.4px] w-8 rounded-full" />
            <span className="text-muted-foreground text-sm">確認中…</span>
          </div>
        ) : null}

        {status === "unsupported" ? (
          <Alert>
            <AlertDescription>
              この端末では Push 通知に対応していません。
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "ios-add-to-home" ? (
          <Alert>
            <AlertDescription>
              通知を受け取るには、Safari
              の共有ボタンから「ホーム画面に追加」し、追加したアイコンからこのアプリを開いてください。
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "subscribed" || status === "unsubscribed" ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              {status === "subscribed"
                ? "この端末で有効です"
                : "この端末ではオフです"}
            </p>
            <div className="flex items-center gap-2">
              {isPending ? <Spinner /> : null}
              <Switch
                checked={status === "subscribed"}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  void (checked ? enable() : disable());
                }}
                aria-label={
                  status === "subscribed"
                    ? "Push 通知を無効にする"
                    : "Push 通知を有効にする"
                }
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
