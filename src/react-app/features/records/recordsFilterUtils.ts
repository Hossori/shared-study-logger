/**
 * 学習記録一覧のユーザーフィルタ共通ロジック。
 */
export type RecordsFilterMode = "all" | "mine" | "specify";

export function computeEffectiveUserIds(
  mode: RecordsFilterMode,
  specifiedUserIds: string[],
  meId: string | undefined,
): string[] | undefined {
  if (mode === "all") return undefined;
  if (mode === "mine") return meId ? [meId] : undefined;
  if (mode === "specify" && specifiedUserIds.length >= 1) {
    return specifiedUserIds;
  }
  return undefined;
}

/**
 * フィルタ適用中かどうか（空状態文言の分岐用）。
 */
export function isFilterApplied(
  effectiveUserIds: string[] | undefined,
): boolean {
  return effectiveUserIds !== undefined && effectiveUserIds.length > 0;
}
