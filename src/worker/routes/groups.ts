import { Hono } from "hono";
import type { Group } from "../../../shared/schemas";
import { getGroupsForUser, isUserInGroup, listGroupMembers } from "../lib/db";
import type { AuthVariables } from "../middleware/requireAuth";

/**
 * グループAPI
 * - GET /              所属グループ一覧
 * - GET /:groupId/members  所属メンバーの公開情報
 * requireAuthはindex.tsでマウント時に適用される。
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

groupsRoutes.get("/:groupId/members", async (c) => {
  const user = c.get("user");
  const groupId = c.req.param("groupId");
  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }
  const members = await listGroupMembers(c.env.DB, groupId);
  return c.json({ members });
});
