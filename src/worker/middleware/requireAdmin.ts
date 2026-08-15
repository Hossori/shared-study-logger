import { createMiddleware } from "hono/factory";
import { isAdmin } from "../../../shared/schemas";
import type { AuthVariables } from "./requireAuth";

/**
 * `requireAuth` の後に使い、ADMIN 以外は 403 を返す。
 * 次 PR（通知管理 UI 等）の管理者専用エンドポイント用。
 */
export const requireAdmin = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ error: "forbidden" }, 403);
  }
  await next();
});
