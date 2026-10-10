/**
 * ログインフォームの入力。trim と形式はここで行い、HTTP 契約へ pipe する。
 */
import { z } from "zod";
import { LoginRequestSchema } from "@shared/schemas";

export const LoginFormSchema = z
  .object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(1),
  })
  .pipe(LoginRequestSchema);
