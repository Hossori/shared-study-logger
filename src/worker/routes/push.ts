import { Hono } from "hono";
import { PushSubscriptionSchema } from "../../../shared/schemas";
import {
  deletePushSubscriptionByEndpoint,
  upsertPushSubscription,
} from "../lib/db";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

/**
 * Push購読API
 * - GET    /vapid-public-key  VAPID公開鍵の取得（認証不要）
 * - POST   /subscribe         購読情報の登録（要認証）
 * - DELETE /subscribe         購読の解除（要認証）
 */
export const pushRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

pushRoutes.get("/vapid-public-key", (c) => {
  return c.json({ publicKey: c.env.VAPID_PUBLIC_KEY });
});

pushRoutes.post("/subscribe", requireAuth, async (c) => {
  const user = c.get("user");
  const json = await c.req.json().catch(() => null);
  const parsed = PushSubscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  await upsertPushSubscription(c.env.DB, {
    id: crypto.randomUUID(),
    userId: user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    authKey: parsed.data.keys.auth,
    userAgent: c.req.header("user-agent") ?? null,
  });

  return c.json({ ok: true });
});

pushRoutes.delete("/subscribe", requireAuth, async (c) => {
  const user = c.get("user");
  const json = await c.req.json().catch(() => null);
  const parsed = PushSubscriptionSchema.pick({ endpoint: true }).safeParse(
    json,
  );
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  await deletePushSubscriptionByEndpoint(
    c.env.DB,
    user.id,
    parsed.data.endpoint,
  );

  return c.json({ ok: true });
});
