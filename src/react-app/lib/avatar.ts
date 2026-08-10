/**
 * アバター表示用ヘルパー。
 *
 * `avatarKey` に対応するプリセット画像 URL を返す。プリセット未登録・キー未設定の
 * 場合は `null` を返し、呼び出し側で頭文字などのデフォルト表示にフォールバックする。
 * マイページ担当がプリセットを追加したら `AVATAR_PRESETS` を拡張すればよい。
 */

const AVATAR_PRESETS: Record<string, string> = {
  // プリセット画像はマイページ側で追加予定。キーだけ先行して受けられるようにしておく。
};

export function getAvatarUrl(
  avatarKey: string | null | undefined,
): string | null {
  if (!avatarKey) return null;
  return AVATAR_PRESETS[avatarKey] ?? null;
}

/** displayName からアバター用の頭文字を取る（空なら "?"）。 */
export function getAvatarInitial(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "?";
  return Array.from(trimmed)[0] ?? "?";
}

/** displayName から安定した背景色クラスを選ぶ（デフォルト円用）。 */
export function getAvatarFallbackColorClass(displayName: string): string {
  const palette = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-teal-500",
  ] as const;
  let hash = 0;
  for (const char of displayName) {
    hash = (hash + char.charCodeAt(0)) % palette.length;
  }
  return palette[hash] ?? palette[0];
}
