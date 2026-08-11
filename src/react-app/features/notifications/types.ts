/**
 * アプリ内通知（クライアントローカル）の型。
 * サーバー通知 API が追加されたら、同形の item にマージして一覧表示できる想定。
 */
export type AppNotificationKind = "pwa-install" | "push-opt-in";

export interface AppNotificationItem {
  /** 安定 ID（dismiss 永続化・リスト key 用） */
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  /** true のときヘッダバッジ件数に含める */
  countsTowardBadge: boolean;
}
