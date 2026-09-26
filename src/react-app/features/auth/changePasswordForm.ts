/**
 * パスワード変更フォームの入力。確認欄は HTTP 契約に含めず、ここで落として送る。
 */
import { z } from "zod";
import { ChangePasswordRequestSchema } from "@shared/schemas";

export const ChangePasswordFormSchema = ChangePasswordRequestSchema.extend({
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
  }));
