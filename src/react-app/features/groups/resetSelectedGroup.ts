import {
  persistSelectedGroupId,
  type SelectedGroupStorage,
} from "./selectedGroup";
import { useSelectedGroupStore } from "./selectedGroupStore";

/** 選択中グループの実行時キャッシュと localStorage をクリアする。 */
export function resetSelectedGroup(storage?: SelectedGroupStorage): void {
  useSelectedGroupStore.setState({ selectedGroupId: null });
  persistSelectedGroupId(null, storage);
}
