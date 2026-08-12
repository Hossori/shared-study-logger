/**
 * プロフィールアバターのプリセット定義。
 * 画像アップロードは行わず、あらかじめ用意した候補から選ぶ。
 * Worker（avatarKey バリデーション）とフロント（表示）の両方から参照する。
 */
import { z } from "zod";

export const AVATAR_KEYS = [
  "avoidy",
  "lavender",
  "fever",
  "born",
  "innocence",
  "stolen",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const AvatarKeySchema = z.enum(AVATAR_KEYS);

/** プリセットキー → public/avatars 配下のパス */
export const AVATAR_PATHS: Record<AvatarKey, string> = {
  avoidy: "/avatars/1_avoidy.png",
  lavender: "/avatars/2_lavender.png",
  fever: "/avatars/3_fever.png",
  born: "/avatars/4_born.png",
  innocence: "/avatars/5_innocence.png",
  stolen: "/avatars/6_stolen.png",
};

/**
 * アバターキーから画像URLを返す。未設定・未知キーは null（表示はクライアントで Lucide アイコン）。
 * ヘッダ等の表示側から import して使う。
 */
export function getAvatarUrl(
  avatarKey: string | null | undefined,
): string | null {
  if (
    avatarKey != null &&
    (AVATAR_KEYS as readonly string[]).includes(avatarKey)
  ) {
    return AVATAR_PATHS[avatarKey as AvatarKey];
  }
  return null;
}
