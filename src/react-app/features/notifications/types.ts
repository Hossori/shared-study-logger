/**
 * アプリ内通知（ベル一覧）の型。
 * クライアントローカル（PWA / Push）とサーバー配信の案内を同じ item に載せる。
 */
export type AppNotificationKind =
  "pwa-install" | "push-opt-in" | "announcement";

export interface AppNotificationItem {
  /** 安定 ID（dismiss 永続化・リスト key 用） */
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  /** true のときヘッダバッジ件数に含める */
  countsTowardBadge: boolean;
}
