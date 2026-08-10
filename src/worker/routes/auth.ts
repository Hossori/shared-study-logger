import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
  UpdateProfileRequestSchema,
  type User,
} from "../../../shared/schemas";
import {
  getUserByEmail,
  getUserById,
  toUser,
  updateUserPassword,
  updateUserProfile,
} from "../lib/db";
import {
  generateSaltHex,
  hashPassword,
  verifyPassword,
} from "../lib/auth";
import {
  createSession,
  destroySession,
  SESSION_TTL_SECONDS,
} from "../lib/session";
import {
  requireAuth,
  SESSION_COOKIE_NAME,
  type AuthVariables,
} from "../middleware/requireAuth";

/**
 * 認証API（login / logout / me / プロフィール更新 / パスワード変更）
 * 認証・セッションフローの詳細は
 * `.cursor/skills/shared-study-logger-overview/reference/auth.md` を参照。
 */
export const authRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

authRoutes.post("/login", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }
  const { email, password } = parsed.data;

  const userRow = await getUserByEmail(c.env.DB, email);
  if (!userRow) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const isValid = await verifyPassword(
    password,
    userRow.password_salt,
    userRow.password_hash,
  );
  if (!isValid) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const { token } = await createSession(c.env.SESSIONS, userRow.id);

  // `pnpm dev`（Vite dev server）はHTTPで配信されるため、`Secure`属性付きCookieだと
  // ブラウザに保存されずログインE2E確認ができない。本番(Cloudflare)は常にHTTPSで配信される
  // ため、リクエストURLのプロトコルに応じて`secure`を切り替えても本番動作に影響はない。
  const isHttps = new URL(c.req.url).protocol === "https:";
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  const user: User = toUser(userRow);
  return c.json({ user });
});

authRoutes.post("/logout", requireAuth, async (c) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) {
    await destroySession(c.env.SESSIONS, token);
  }
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const authUser = c.get("user");
  // requireAuth 通過時点のスナップショットではなく、最新のプロフィールを返す
  const userRow = await getUserById(c.env.DB, authUser.id);
  if (!userRow) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.json({ user: toUser(userRow) });
});

authRoutes.patch("/me", requireAuth, async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = UpdateProfileRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  const authUser = c.get("user");
  const updated = await updateUserProfile(c.env.DB, authUser.id, {
    displayName: parsed.data.displayName,
    bio: parsed.data.bio,
    avatarKey: parsed.data.avatarKey,
  });
  if (!updated) {
    return c.json({ error: "unauthorized" }, 401);
  }

  return c.json({ user: toUser(updated) });
});

authRoutes.post("/password", requireAuth, async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = ChangePasswordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  const authUser = c.get("user");
  const userRow = await getUserById(c.env.DB, authUser.id);
  if (!userRow) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const { currentPassword, newPassword } = parsed.data;
  const isValid = await verifyPassword(
    currentPassword,
    userRow.password_salt,
    userRow.password_hash,
  );
  if (!isValid) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const salt = generateSaltHex();
  const hash = await hashPassword(newPassword, salt);
  await updateUserPassword(c.env.DB, authUser.id, hash, salt);

  return c.json({ ok: true });
});
