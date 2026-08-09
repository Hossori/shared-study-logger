/**
 * ラベル付きフォーム入力の汎用部品。`LoginPage`/`PostRecordModal`で完全に同一だった
 * ラベル・inputのTailwindクラスをここに集約する。バリデーション・状態管理(value/onChange)は
 * 呼び出し側(features/配下)が引き続き所有し、ここでは見た目のみを共通化する。
 */
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const fieldLabelClassName = "mb-1 block text-sm font-medium text-gray-700";
const fieldControlClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function TextField({
  id,
  label,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <input
        id={id}
        className={cn(fieldControlClassName, className)}
        {...inputProps}
      />
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
}

export function TextAreaField({
  id,
  label,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <textarea
        id={id}
        className={cn(fieldControlClassName, "resize-none", className)}
        {...textareaProps}
      />
    </div>
  );
}
