/**
 * 公開ユーザープロフィール API（`GET /api/users/:userId`）。
 * email は返さない。認証必須。
 */
import { Hono } from "hono";
import { getUserById, toPublicUser } from "../lib/db";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

export const usersRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

usersRoutes.get("/:userId", requireAuth, async (c) => {
  const userId = c.req.param("userId");
  const userRow = await getUserById(c.env.DB, userId);
  if (!userRow) {
    return c.json({ error: "not_found" }, 404);
  }
  return c.json({ user: toPublicUser(userRow) });
});
