/**
 * Push 購読の有効化・無効化ペイロード。HTTP 契約へ pipe する。
 */
import { z } from "zod";
import { PushSubscriptionSchema } from "@shared/schemas";

export const PushSubscribeFormSchema = z
  .object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  })
  .pipe(PushSubscriptionSchema);

export const PushUnsubscribeFormSchema = z
  .object({
    endpoint: z.string(),
  })
  .pipe(PushSubscriptionSchema.pick({ endpoint: true }));
