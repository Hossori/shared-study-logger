/**
 * 条件分岐でTailwindクラス名を組み立てる際に使う薄いヘルパー。`clsx`をそのまま
 * 呼び出しているだけだが、呼び出し側のimport元を`lib/`配下に統一するためラップしている。
 *
 * `tailwind-merge`（クラス名の意味的な重複を検出し後勝ちさせるライブラリ）は導入していない。
 * このリポジトリの`variant`用クラス（例: `Button`の`variantClassNames`）と呼び出し側が渡す
 * `className`は、色/ホバー系と余白/文字サイズ系のように担当するユーティリティグループが
 * 重ならないよう設計されているため、クラスの重複解決自体が発生しない
 * （詳細は`reference/code-quality.md`の「Tailwind の可読性」参照）。
 * 将来、同じユーティリティグループ（例: 複数箇所からの`bg-*`）が重なる書き方が必要になった
 * 場合は`tailwind-merge`の導入を再検討すること。
 */
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
