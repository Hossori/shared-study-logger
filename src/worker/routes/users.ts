/**
 * 公開ユーザープロフィール API（`GET /api/users/:userId`）。
 * email は返さない。認証必須。
 */
import { Hono } from "hono";
import { PublicUserResponseSchema } from "../../../shared/schemas";
import { getUserById, toPublicUser } from "../lib/db";
import { jsonParsed, parseResourceId } from "../lib/httpSchema";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

export const usersRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

usersRoutes.get("/:userId", requireAuth, async (c) => {
  const userId = parseResourceId(c.req.param("userId"));
  if (!userId) {
    return c.json({ error: "invalid_request" }, 400);
  }
  const userRow = await getUserById(c.env.DB, userId);
  if (!userRow) {
    return c.json({ error: "not_found" }, 404);
  }
  return jsonParsed(c, PublicUserResponseSchema, {
    user: toPublicUser(userRow),
  });
});
