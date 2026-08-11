/**
 * 通知モーダル開閉と、ローカル通知の dismiss 状態。
 * dismiss は localStorage に永続化し、同一ブラウザでは再表示しない。
 */
import { create } from "zustand";

const DISMISSED_STORAGE_KEY = "ssl:dismissed-notifications";

function readDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeDismissedIds(ids: string[]) {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // quota / private mode などでは永続化失敗を無視
  }
}

interface NotificationUiState {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  dismissedIds: string[];
  dismiss: (id: string) => void;
  isDismissed: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationUiState>((set, get) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  dismissedIds: typeof window === "undefined" ? [] : readDismissedIds(),

  dismiss: (id) => {
    const next = Array.from(new Set([...get().dismissedIds, id]));
    writeDismissedIds(next);
    set({ dismissedIds: next });
  },

  isDismissed: (id) => get().dismissedIds.includes(id),
}));
