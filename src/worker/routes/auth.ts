import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { LoginRequestSchema, type User } from "../../../shared/schemas";
import { getUserByEmail } from "../lib/db";
import { verifyPassword } from "../lib/auth";
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
 * 認証API（POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me）
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

  const user: User = {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.display_name,
    createdAt: userRow.created_at,
  };
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
  const user: User = {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.displayName,
    createdAt: authUser.createdAt,
  };
  return c.json({ user });
});
