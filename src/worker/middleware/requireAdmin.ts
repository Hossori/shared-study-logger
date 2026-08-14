import { createMiddleware } from "hono/factory";
import { isAdmin } from "../../../shared/schemas";
import type { AuthVariables } from "./requireAuth";

/**
 * `requireAuth` の後に使い、ADMIN 以外は 403 `{ error: "forbidden" }` を返す。
 * `/api/admin/notifications` など管理者専用エンドポイントに重ねる。
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
