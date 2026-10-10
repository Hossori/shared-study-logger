/**
 * ログインフォームの入力。形式と password の空拒否はここで行い、HTTP 契約へ pipe する。
 */
import { z } from "zod";
import { LoginRequestSchema } from "@shared/schemas";

export const LoginFormSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .pipe(LoginRequestSchema);
