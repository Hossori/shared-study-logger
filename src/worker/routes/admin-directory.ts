import { Hono } from "hono";
import {
  AddGroupMemberRequestSchema,
  CreateAdminGroupRequestSchema,
  CreateAdminUserRequestSchema,
  type AdminGroup,
  type Group,
  type User,
} from "../../../shared/schemas";
import { generateSaltHex, hashPassword } from "../lib/auth";
import {
  addGroupMember,
  createGroup,
  createUser,
  getGroupById,
  getUserByEmail,
  getUserById,
  isUserInGroup,
  listAllGroupsWithMembers,
  listUsers,
  removeGroupMember,
  toGroup,
  toUser,
} from "../lib/db";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireAuth, type AuthVariables } from "../middleware/requireAuth";

type AdminEnv = {
  Bindings: Env;
  Variables: AuthVariables;
};

/**
 * 管理者向けユーザー・グループ・所属 API。
 * - GET/POST /users
 * - GET/POST /groups
 * - POST /groups/:groupId/members
 * - DELETE /groups/:groupId/members/:userId
 * すべて requireAuth + requireAdmin。USER は 403 `{ error: "forbidden" }`。
 */
export const adminUsersRoutes = new Hono<AdminEnv>();
adminUsersRoutes.use(requireAuth);
adminUsersRoutes.use(requireAdmin);

adminUsersRoutes.get("/", async (c) => {
  const rows = await listUsers(c.env.DB);
  const users: User[] = rows.map(toUser);
  return c.json({ users });
});

adminUsersRoutes.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = CreateAdminUserRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      { error: "invalid_request", issues: parsed.error.issues },
      400,
    );
  }

  const existing = await getUserByEmail(c.env.DB, parsed.data.email);
  if (existing) {
    return c.json({ error: "email_taken" }, 409);
  }

  const passwordSalt = generateSaltHex();
  const passwordHash = await hashPassword(parsed.data.password, passwordSalt);
  const row = await createUser(c.env.DB, {
    id: crypto.randomUUID(),
    email: parsed.data.email,
    passwordHash,
    passwordSalt,
    displayName: parsed.data.displayName,
  });

  return c.json({ user: toUser(row) }, 201);
});

export const adminGroupsRoutes = new Hono<AdminEnv>();
adminGroupsRoutes.use(requireAuth);
adminGroupsRoutes.use(requireAdmin);

adminGroupsRoutes.get("/", async (c) => {
  const rows = await listAllGroupsWithMembers(c.env.DB);
  const groups: AdminGroup[] = rows.map(({ group, members }) => ({
    ...toGroup(group),
    members: members.map(toUser),
  }));
  return c.json({ groups });
});

adminGroupsRoutes.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = CreateAdminGroupRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      { error: "invalid_request", issues: parsed.error.issues },
      400,
    );
  }

  const row = await createGroup(c.env.DB, {
    id: crypto.randomUUID(),
    name: parsed.data.name,
  });
  const group: Group = toGroup(row);
  return c.json({ group }, 201);
});

adminGroupsRoutes.post("/:groupId/members", async (c) => {
  const groupId = c.req.param("groupId");
  const group = await getGroupById(c.env.DB, groupId);
  if (!group) {
    return c.json({ error: "not_found" }, 404);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = AddGroupMemberRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json(
      { error: "invalid_request", issues: parsed.error.issues },
      400,
    );
  }

  const userRow = await getUserById(c.env.DB, parsed.data.userId);
  if (!userRow) {
    return c.json({ error: "not_found" }, 404);
  }

  if (await isUserInGroup(c.env.DB, parsed.data.userId, groupId)) {
    return c.json({ error: "already_member" }, 409);
  }

  await addGroupMember(c.env.DB, groupId, parsed.data.userId);
  return c.json({ member: toUser(userRow) }, 201);
});

adminGroupsRoutes.delete("/:groupId/members/:userId", async (c) => {
  const groupId = c.req.param("groupId");
  const userId = c.req.param("userId");

  const group = await getGroupById(c.env.DB, groupId);
  if (!group) {
    return c.json({ error: "not_found" }, 404);
  }

  const userRow = await getUserById(c.env.DB, userId);
  if (!userRow) {
    return c.json({ error: "not_found" }, 404);
  }

  const deleted = await removeGroupMember(c.env.DB, groupId, userId);
  if (!deleted) {
    return c.json({ error: "not_member" }, 404);
  }

  return c.json({ ok: true });
});
