import { Hono } from "hono";
import { InAppNotificationsResponseSchema } from "../../../shared/schemas";
import { listEnabledAppNotifications } from "../lib/db";
import { jsonParsed } from "../lib/httpSchema";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

/**
 * アプリ内通知（ユーザー向け）
 * - GET /  有効な通知一覧（要認証）
 */
export const notificationsRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

notificationsRoutes.get("/", requireAuth, async (c) => {
  const notifications = await listEnabledAppNotifications(c.env.DB);
  return jsonParsed(c, InAppNotificationsResponseSchema, { notifications });
});
