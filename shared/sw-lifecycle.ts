/**
 * Service Worker の install 時マイグレーション分岐（純関数）。
 */

export type InstallMigrationAction = "none" | "skip-waiting" | "save-marker";

/** PWA 更新ブリッジ用マーカーの有無と旧 active Worker の有無から install 時の処理を決める。 */
export function getInstallMigrationAction({
  hasMarker,
  hasActiveWorker,
}: {
  hasMarker: boolean;
  hasActiveWorker: boolean;
}): InstallMigrationAction {
  if (hasMarker) return "none";
  if (hasActiveWorker) return "skip-waiting";
  return "save-marker";
}
