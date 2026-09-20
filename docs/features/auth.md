# 認証・セッション

固定アカウント。管理者が `/admin/groups` または seed / SQL で登録する。Cookie `session`（HttpOnly, SameSite=Lax）。KV `SESSIONS` に TTL 30 日。

## 不変条件

- 公開の自己登録 API は無い。作成時 role は `USER`。ロール変更は D1 の `UPDATE`
- パスワードハッシュは `src/worker/lib/auth.ts` と `scripts/seed-users.mjs` で同一
- Cookie の `Secure` は `new URL(c.req.url).protocol === "https:"` で判定する（ローカル HTTP でもログインできる）
- アバターはプリセットのみ（`shared/avatars.ts`）。`null` は Lucide アイコン

## 流れ

`POST /api/auth/login` → Zod → D1 → PBKDF2 検証 → KV セッション → Set-Cookie。以降は `requireAuth` が `c.set("user")`。管理者 API は `requireAdmin` を重ねる。適用箇所の正は [api.md](../api.md)。

フロントは `useMeQuery`（`GET /api/auth/me`）。401 は `null`。ガードは [routing.md](routing.md)。

プロフィール: `PATCH /api/auth/me`。パスワード: `POST /api/auth/password`（現在のパスワード検証のうえ再ハッシュ）。

## 変更するとき

エンドポイント追加は [api.md](../api.md)。スキーマは [zod-schemas](../../.agents/skills/zod-schemas/SKILL.md)。ゲートは [testing.md](../testing.md)。

## 入口

- `src/worker/routes/auth.ts`
- `src/worker/lib/auth.ts` / `session.ts`
- `src/worker/middleware/requireAuth.ts` / `requireAdmin.ts`
- `src/react-app/queries/useAuth.ts`
