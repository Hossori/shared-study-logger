/**
 * フィルタ適用中かどうか（空状態文言の分岐用）。
 */
export function isFilterApplied(
  effectiveUserIds: string[] | undefined,
): boolean {
  return effectiveUserIds !== undefined && effectiveUserIds.length > 0;
}
