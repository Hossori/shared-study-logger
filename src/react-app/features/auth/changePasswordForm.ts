/**
 * パスワード変更フォームの入力。確認欄は HTTP 契約に含めず、ここで落として送る。
 * 画面に出す文言はこのスキーマの issue.message を使う。
 */
import { z } from "zod";
import { ChangePasswordRequestSchema } from "@shared/schemas";

const CHANGE_PASSWORD_FIELDS = [
  "currentPassword",
  "newPassword",
  "confirmPassword",
] as const;

type ChangePasswordField = (typeof CHANGE_PASSWORD_FIELDS)[number];

export type ChangePasswordFieldErrors = Partial<
  Record<ChangePasswordField, string>
>;

export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください。"),
    newPassword: z
      .string()
      .min(8, "新しいパスワードは8文字以上で入力してください。")
      .max(128, "新しいパスワードは128文字以内で入力してください。"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "新しいパスワード（確認）が一致しません。",
      });
    }
  })
  .transform(({ currentPassword, newPassword }) => ({
    currentPassword,
    newPassword,
  }))
  .pipe(ChangePasswordRequestSchema);

function isChangePasswordField(value: unknown): value is ChangePasswordField {
  return (
    typeof value === "string" &&
    CHANGE_PASSWORD_FIELDS.some((field) => field === value)
  );
}

/** 最初の issue の message を欄ごとに拾う。文言の割り当てはスキーマ側。 */
export function changePasswordFieldErrors(error: {
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>;
}): ChangePasswordFieldErrors {
  const fieldErrors: ChangePasswordFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (!isChangePasswordField(field) || fieldErrors[field]) continue;
    fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}
