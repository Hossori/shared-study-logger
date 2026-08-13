/**
 * Push再送時に同一の学習記録通知を置換するための、安定したNotification tagを返す。
 * recordId がない汎用通知は既存の通知表示を維持するため tag を持たない。
 */
export function getStudyRecordNotificationTag(
  data: Record<string, unknown> | undefined,
): string | undefined {
  const recordId = data?.recordId;
  if (
    typeof recordId !== "string" ||
    recordId.trim().length === 0 ||
    recordId.length > 128 ||
    [...recordId].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    return undefined;
  }

  return `study-record:${recordId}`;
}
