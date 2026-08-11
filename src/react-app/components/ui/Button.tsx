/**
 * ドメインに依存しない汎用ボタン。色・ホバー・disabled時の見た目のみを共通化し、
 * サイズ(padding/text)やレイアウト(flex-1/w-full等)は呼び出し側が`className`で指定する。
 *
 * 対象外: モバイル用フローティングアクションボタン(`Layout.tsx`の円形ボタン)や
 * `NotificationOptIn.tsx`の購読状態に応じた2色切り替えボタンは、この汎用ボタンでは
 * 表現しづらい一点物のスタイルのため、意図的にそのまま個別実装している
 * （理由は`reference/design-decisions.md`参照）。
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

// 全variant共通の見た目（角丸・太字・トランジション・disabled時の見た目）。
const baseButtonClassName =
  "cursor-pointer rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

// variantごとに異なる色・ホバー時の見た目。
const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", type = "button", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseButtonClassName, variantClassNames[variant], className)}
      {...props}
    />
  );
});

export default Button;
