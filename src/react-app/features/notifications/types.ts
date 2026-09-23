/**
 * アプリ内通知（ベル一覧）の型。
 * クライアントローカル（PWA / Push）とサーバー配信の案内を同じ item に載せる。
 */
export const PWA_INSTALL_NOTIFICATION_ID = "local:pwa-install";
export const PUSH_OPT_IN_NOTIFICATION_ID = "local:push-opt-in";

export type AppNotificationKind =
  "pwa-install" | "push-opt-in" | "announcement";

/** ヘッダが PWA feature から渡すインストール操作。notifications は feature を import しない。 */
export interface PwaInstallActions {
  canPromptInstall: boolean;
  isIosGuide: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export interface AppNotificationItem {
  /** 安定 ID（dismiss 永続化・リスト key 用） */
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  /** true のときヘッダバッジ件数に含める */
  countsTowardBadge: boolean;
}
