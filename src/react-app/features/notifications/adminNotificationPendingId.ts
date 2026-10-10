/**
 * 通知管理テーブルで操作中表示する行 ID（toggle / delete の pending を排他判定）。
 */
export function resolveAdminNotificationPendingRowId(
  toggle: { isPending: boolean; variables?: { id: string } | undefined },
  del: { isPending: boolean; variables?: string | undefined },
): string | undefined {
  if (toggle.isPending) return toggle.variables?.id;
  if (del.isPending) return del.variables;
  return undefined;
}
