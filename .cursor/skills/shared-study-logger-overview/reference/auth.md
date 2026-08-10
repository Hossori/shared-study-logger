# 認証・セッション

[← SKILL.md](../SKILL.md)

- **概要**: 固定アカウント方式（自己登録なし、管理者が事前にDBへ登録）。email/passwordで
  ログインし、Cookie(`session`)ベースのセッション認証を行う。マイページで表示名・自己紹介・
  アバタープリセット・パスワードを変更できる。
- **関連ファイル**:
  - Worker: `src/worker/lib/auth.ts`（PBKDF2ハッシュ生成・検証）、
    `src/worker/lib/session.ts`（KVセッションCRUD）、
    `src/worker/middleware/requireAuth.ts`（Cookie→KV検証→`c.set("user", ...)`）、
    `src/worker/routes/auth.ts`（`/login`,`/logout`,`/me`,`PATCH /me`,`POST /password`）、
    `src/worker/lib/db.ts`（`toUser` / `updateUserProfile` / `updateUserPassword`）
  - フロント: `src/react-app/features/auth/LoginPage.tsx`、
    `src/react-app/features/auth/MyPage.tsx`（`/mypage`）、
    `src/react-app/queries/useAuth.ts`（`useMeQuery`/`useLoginMutation`/`useLogoutMutation`/
    `useUpdateProfileMutation`/`useChangePasswordMutation`）
  - 共通: `shared/schemas.ts`の`LoginRequestSchema`/`UserSchema`/
    `UpdateProfileRequestSchema`/`ChangePasswordRequestSchema`、
    `shared/avatars.ts`（プリセットキー・`getAvatarUrl`）
  - 静的アセット: `public/avatars/{default,fox,owl,cat,bear,penguin,rabbit}.svg`
- **データフロー**: `POST /api/auth/login` → email/passwordをzod検証 →
  `getUserByEmail`でD1照会 → PBKDF2(SHA-256, 100,000 iterations, 32byte, タイミングセーフ比較)で
  `verifyPassword` → 成功時`createSession`でKVに`session:{token}`→`{userId, expiresAt}`を
  TTL 30日で保存 → `Set-Cookie: session=...; HttpOnly; SameSite=Lax`。以降のリクエストは
  `requireAuth`ミドルウェアがCookieのトークンをKVで検証し`c.get("user")`にユーザー情報を載せる。
  フロントは起動時に`useMeQuery`(`GET /api/auth/me`)でログイン状態を判定し、401は例外にせず
  `null`を返す（`src/react-app/routes/ProtectedRoute.tsx`/`GuestRoute.tsx`がこれを使い
  `/login`⇔`/`のリダイレクトを行う。ルーティングの詳細は
  [state-management.md](state-management.md)参照）。
  - プロフィール更新: `PATCH /api/auth/me`（`displayName` / `bio` / `avatarKey`、いずれも任意だが
    少なくとも1つ必須）。`avatarKey`は`AvatarKeySchema`（許可リスト）で検証し、`null`で
    デフォルト画像に戻せる。成功時は更新後の`User`を返す。
  - パスワード変更: `POST /api/auth/password`（`currentPassword` + `newPassword`）。
    現在のパスワードを`verifyPassword`で検証し、新saltを`generateSaltHex`、新ハッシュを
    `hashPassword`（既存PBKDF2）で保存する。
- **注意点・既知の制約**:
  - Cookieの`secure`属性は`new URL(c.req.url).protocol === "https:"`で動的判定している
    （`src/worker/routes/auth.ts`）。`pnpm dev`（HTTP配信）でもブラウザにログインCookieが
    保存されるようにするための開発体験目的の変更で、本番(Cloudflare、常にHTTPS)の挙動には
    影響しない。Cookie属性を触る変更をする際はこの判定式を壊さないよう注意。
  - パスワードハッシュのロジックは`src/worker/lib/auth.ts`と`scripts/seed-users.mjs`で
    **完全に同一**である必要がある（片方だけ変更するとログインできなくなる）。
  - 公開APIでのユーザー登録は存在しない。ユーザー追加は`scripts/seed-users.mjs`または
    直接SQL投入で行う運用。
  - アバターはアップロード不可。プリセット選択のみ（キー一覧は`shared/avatars.ts`の
    `AVATAR_KEYS`）。ヘッダ等での表示は`getAvatarUrl(avatarKey)`を使う。
