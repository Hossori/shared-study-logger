import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { User } from "../../../shared/schemas";
import { getSession } from "../lib/session";
import { getUserById, toUser } from "../lib/db";

export const SESSION_COOKIE_NAME = "session";

/** requireAuthを通過したハンドラのcontextに載る認証済みユーザー情報。 */
export type AuthUser = User;

export interface AuthVariables {
  user: AuthUser;
}

/**
 * Cookieのセッショントークンを`SESSIONS` KVで検証し、
 * ログイン中ユーザーをコンテキスト(`c.get("user")`)に載せる認証ミドルウェア。
 * 未認証・セッション失効・ユーザー不在の場合は401を返す。
 */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const session = await getSession(c.env.SESSIONS, token);
  if (!session || session.expiresAt * 1000 < Date.now()) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const user = await getUserById(c.env.DB, session.userId);
  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }

  c.set("user", toUser(user));

  await next();
});
