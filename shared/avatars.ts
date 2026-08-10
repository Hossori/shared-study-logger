/**
 * プロフィールアバターのプリセット定義。
 * 画像アップロードは行わず、あらかじめ用意した候補から選ぶ。
 * Worker（avatarKey バリデーション）とフロント（表示）の両方から参照する。
 */
import { z } from "zod";

export const AVATAR_KEYS = [
  "fox",
  "owl",
  "cat",
  "bear",
  "penguin",
  "rabbit",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const AvatarKeySchema = z.enum(AVATAR_KEYS);

/** プリセットキー → public/avatars 配下のパス */
export const AVATAR_PATHS: Record<AvatarKey, string> = {
  fox: "/avatars/fox.svg",
  owl: "/avatars/owl.svg",
  cat: "/avatars/cat.svg",
  bear: "/avatars/bear.svg",
  penguin: "/avatars/penguin.svg",
  rabbit: "/avatars/rabbit.svg",
};

/** avatarKey が null / 未設定のときに使うデフォルト画像 */
export const DEFAULT_AVATAR_PATH = "/avatars/default.svg";

/**
 * アバターキーから画像URLを返す。未設定・未知キーはデフォルト画像。
 * ヘッダ等の表示側から import して使う。
 */
export function getAvatarUrl(avatarKey: string | null | undefined): string {
  if (
    avatarKey != null &&
    (AVATAR_KEYS as readonly string[]).includes(avatarKey)
  ) {
    return AVATAR_PATHS[avatarKey as AvatarKey];
  }
  return DEFAULT_AVATAR_PATH;
}
