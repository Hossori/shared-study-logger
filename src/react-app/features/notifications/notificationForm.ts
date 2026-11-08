/**
 * アプリ内通知作成フォーム。trim はここで行い、HTTP 契約へ pipe する。
 */
import { z } from "zod";
import { CreateInAppNotificationRequestSchema } from "@shared/schemas";

export const CreateInAppNotificationFormSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
  })
  .pipe(CreateInAppNotificationRequestSchema);
