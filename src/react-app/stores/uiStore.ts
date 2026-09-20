/**
 * 画面を跨ぐクライアント状態（通知許可状態など）の実行時キャッシュ。
 * 選択中グループの正本は URL + localStorage（docs/features/routing.md）。
 */
import { create } from "zustand";

export type NotificationOptInStatus =
  | "unsupported" // ブラウザがPush非対応
  | "default" // 未リクエスト
  | "granted"
  | "denied";

interface UiState {
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;

  notificationStatus: NotificationOptInStatus;
  setNotificationStatus: (status: NotificationOptInStatus) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedGroupId: null,
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),

  notificationStatus: "default",
  setNotificationStatus: (status) => set({ notificationStatus: status }),
}));
