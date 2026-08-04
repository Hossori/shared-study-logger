import { Hono } from "hono";
import type { Group } from "../../../shared/schemas";
import { getGroupsForUser } from "../lib/db";
import type { AuthVariables } from "../middleware/requireAuth";

/**
 * グループAPI（GET /api/groups）
 * requireAuthはindex.tsでマウント時に適用される。
 * ログイン中ユーザーが所属するグループ一覧をD1から取得して返す。
 */
export const groupsRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

groupsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const rows = await getGroupsForUser(c.env.DB, user.id);
  const groups: Group[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
  return c.json({ groups });
});
