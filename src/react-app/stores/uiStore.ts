/**
 * クライアント状態（選択中グループID、投稿モーダル開閉状態、通知許可状態など）を管理するZustandストア。
 * サーバー状態（記録一覧・グループ一覧等）はTanStack Query側（`src/react-app/queries/`）で扱う。
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

  isPostModalOpen: boolean;
  openPostModal: () => void;
  closePostModal: () => void;

  notificationStatus: NotificationOptInStatus;
  setNotificationStatus: (status: NotificationOptInStatus) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedGroupId: null,
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),

  isPostModalOpen: false,
  openPostModal: () => set({ isPostModalOpen: true }),
  closePostModal: () => set({ isPostModalOpen: false }),

  notificationStatus: "default",
  setNotificationStatus: (status) => set({ notificationStatus: status }),
}));
