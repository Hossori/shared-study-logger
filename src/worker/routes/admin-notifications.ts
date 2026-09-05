import { Hono } from "hono";
import {
  CreateInAppNotificationRequestSchema,
  UpdateInAppNotificationRequestSchema,
} from "../../../shared/schemas";
import {
  createAppNotification,
  deleteAppNotification,
  getAppNotification,
  listAppNotifications,
  setAppNotificationEnabled,
} from "../lib/db";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

/**
 * アプリ内通知の管理者 CRUD
 * - GET    /        全件一覧（無効含む）
 * - POST   /        作成
 * - PATCH  /:id     有効/無効の切替
 * - DELETE /:id     削除
 * すべて requireAuth + requireAdmin。USER は 403 `{ error: "forbidden" }`。
 */
export const adminNotificationsRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

adminNotificationsRoutes.use(requireAuth);
adminNotificationsRoutes.use(requireAdmin);

adminNotificationsRoutes.get("/", async (c) => {
  const notifications = await listAppNotifications(c.env.DB);
  return c.json({ notifications });
});

adminNotificationsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const json = await c.req.json().catch(() => null);
  const parsed = CreateInAppNotificationRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      { error: "invalid_request", issues: parsed.error.issues },
      400,
    );
  }

  const notification = await createAppNotification(c.env.DB, {
    id: crypto.randomUUID(),
    title: parsed.data.title,
    body: parsed.data.body,
    linkUrl: parsed.data.linkUrl ?? null,
    linkLabel: parsed.data.linkLabel ?? null,
    enabled: parsed.data.enabled ?? true,
    createdBy: user.id,
  });

  return c.json({ notification }, 201);
});

adminNotificationsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await getAppNotification(c.env.DB, id);
  if (!existing) {
    return c.json({ error: "not_found" }, 404);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = UpdateInAppNotificationRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      { error: "invalid_request", issues: parsed.error.issues },
      400,
    );
  }

  const notification = await setAppNotificationEnabled(
    c.env.DB,
    id,
    parsed.data.enabled,
  );
  if (!notification) {
    return c.json({ error: "not_found" }, 404);
  }

  return c.json({ notification });
});

adminNotificationsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteAppNotification(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.json({ ok: true });
});
