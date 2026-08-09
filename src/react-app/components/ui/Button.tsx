/**
 * ドメインに依存しない汎用ボタン。色・ホバー・disabled時の見た目のみを共通化し、
 * サイズ(padding/text)やレイアウト(flex-1/w-full等)は呼び出し側が`className`で指定する。
 *
 * 対象外: モバイル用フローティングアクションボタン(`Layout.tsx`の円形ボタン)や
 * `NotificationOptIn.tsx`の購読状態に応じた2色切り替えボタンは、この汎用ボタンでは
 * 表現しづらい一点物のスタイルのため、意図的にそのまま個別実装している
 * （理由は`reference/design-decisions.md`参照）。
 */
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClassNames[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
