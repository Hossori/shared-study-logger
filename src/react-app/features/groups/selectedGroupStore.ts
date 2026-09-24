/**
 * 選択中グループの実行時キャッシュ。
 * 正本は URL と localStorage（selectedGroup.ts）。
 */
import { create } from "zustand";

interface SelectedGroupState {
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
}

export const useSelectedGroupStore = create<SelectedGroupState>((set) => ({
  selectedGroupId: null,
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),
}));
