import { Hono } from "hono";
import {
  GroupMembersResponseSchema,
  GroupsResponseSchema,
  type Group,
} from "@shared/schemas";
import { getGroupsForUser, isUserInGroup, listGroupMembers } from "../lib/db";
import { jsonParsed, parseResourceId } from "../lib/httpSchema";
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
  return jsonParsed(c, GroupsResponseSchema, { groups });
});

groupsRoutes.get("/:groupId/members", async (c) => {
  const user = c.get("user");
  const groupId = parseResourceId(c.req.param("groupId"));
  if (!groupId) {
    return c.json({ error: "invalid_request" }, 400);
  }
  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }
  const members = await listGroupMembers(c.env.DB, groupId);
  return jsonParsed(c, GroupMembersResponseSchema, { members });
});
