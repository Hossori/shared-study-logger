/**
 * ラベル付きフォーム入力の汎用部品。`LoginPage`/`PostRecordModal`で完全に同一だった
 * ラベル・inputのTailwindクラスをここに集約する。バリデーション・状態管理(value/onChange)は
 * 呼び出し側(features/配下)が引き続き所有し、ここでは見た目のみを共通化する。
 *
 * - `required`: ラベル右に赤アスタリスクを表示（任意項目はラベルのみ）
 * - `error` / `errorMessage`: エラー時の枠線色と項目直下メッセージ
 */
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const fieldLabelClassName = "mb-1 block text-sm font-medium text-gray-700";
const fieldControlClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const fieldControlErrorClassName =
  "border-red-500 focus:border-red-500 focus:ring-red-500";
const fieldErrorMessageClassName = "mt-1 text-sm text-red-600";
const requiredMarkClassName = "ml-0.5 text-red-500";

interface FieldChromeProps {
  id: string;
  label: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
}

function FieldLabel({
  id,
  label,
  required,
}: Pick<FieldChromeProps, "id" | "label" | "required">) {
  return (
    <label htmlFor={id} className={fieldLabelClassName}>
      {label}
      {required ? (
        <span className={requiredMarkClassName} aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldErrorMessage({
  id,
  showError,
  errorMessage,
}: {
  id: string;
  showError: boolean;
  errorMessage?: string;
}) {
  if (!showError || !errorMessage) return null;
  return (
    <p id={`${id}-error`} className={fieldErrorMessageClassName} role="alert">
      {errorMessage}
    </p>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: boolean;
  errorMessage?: string;
}

export function TextField({
  id,
  label,
  className,
  required,
  error,
  errorMessage,
  ...inputProps
}: TextFieldProps) {
  const showError = Boolean(error) || Boolean(errorMessage);
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} />
      <input
        id={id}
        required={required}
        aria-invalid={showError || undefined}
        aria-describedby={showError && errorMessage ? `${id}-error` : undefined}
        className={cn(
          fieldControlClassName,
          showError && fieldControlErrorClassName,
          className,
        )}
        {...inputProps}
      />
      <FieldErrorMessage
        id={id}
        showError={showError}
        errorMessage={errorMessage}
      />
    </div>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: boolean;
  errorMessage?: string;
}

export function TextAreaField({
  id,
  label,
  className,
  required,
  error,
  errorMessage,
  ...textareaProps
}: TextAreaFieldProps) {
  const showError = Boolean(error) || Boolean(errorMessage);
  return (
    <div>
      <FieldLabel id={id} label={label} required={required} />
      <textarea
        id={id}
        required={required}
        aria-invalid={showError || undefined}
        aria-describedby={showError && errorMessage ? `${id}-error` : undefined}
        className={cn(
          fieldControlClassName,
          "resize-none",
          showError && fieldControlErrorClassName,
          className,
        )}
        {...textareaProps}
      />
      <FieldErrorMessage
        id={id}
        showError={showError}
        errorMessage={errorMessage}
      />
    </div>
  );
}
