/**
 * 選択中グループの正本は URL（ホームの `group` クエリ）と localStorage。
 * 解決優先順位と同期契約は docs/features/routing.md。
 */
export const SELECTED_GROUP_STORAGE_KEY = "selectedGroupId";
export const SELECTED_GROUP_QUERY_KEY = "group";

export type SelectedGroupStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

/** クエリ値。欠如・空文字は「URL にグループ無し」 */
export function parseQueryGroupId(value: string | null): string | null {
  if (value === null || value === "") return null;
  return value;
}

export function resolveSelectedGroupId(
  membershipIds: string[],
  urlGroupId: string | null,
  storedGroupId: string | null,
): string | null {
  if (membershipIds.length === 0) return null;

  const isValid = (id: string | null): id is string =>
    id !== null && membershipIds.includes(id);

  if (isValid(urlGroupId)) return urlGroupId;
  if (isValid(storedGroupId)) return storedGroupId;
  return membershipIds[0] ?? null;
}

export function readStoredSelectedGroupId(
  storage?: Pick<Storage, "getItem">,
): string | null {
  try {
    const store = storage ?? localStorage;
    return parseQueryGroupId(store.getItem(SELECTED_GROUP_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistSelectedGroupId(
  groupId: string | null,
  storage?: SelectedGroupStorage,
): void {
  try {
    const store = storage ?? localStorage;
    if (groupId === null) {
      store.removeItem(SELECTED_GROUP_STORAGE_KEY);
    } else {
      store.setItem(SELECTED_GROUP_STORAGE_KEY, groupId);
    }
  } catch {
    // プライベートモード等で失敗しても、セッション内の store は動かす
  }
}
