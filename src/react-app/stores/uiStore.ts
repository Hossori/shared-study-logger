/**
 * 画面を跨いで残すクライアント状態（選択中グループID、通知許可状態）を管理するZustandストア。
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
