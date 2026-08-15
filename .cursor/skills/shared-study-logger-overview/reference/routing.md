# ルーティング

[← SKILL.md](../SKILL.md)

**react-router** v7系（data router API）。`App.tsx` は
`RouterProvider`（`src/react-app/routes/router.tsx` の `createBrowserRouter` 定義）を
描画するだけの薄いラッパー。採用理由・見送った代替案は
[design-decisions.md](design-decisions.md) 参照。

- **ルート構成**: `/login`（`GuestRoute` 配下、ログイン済みなら `/` へリダイレクト）、`/` と
  `/users/:userId`（いずれも `ProtectedRoute` 配下、未ログインなら `/login` へリダイレクト）、
  `/mypage` は `features/auth/MyPage.tsx` が自分の `/users/:userId` へ Navigate、
  `/admin/notifications` と `/admin/groups` は `AdminRoute` 配下（ADMIN のみ。USER は 403 画面）、
  それ以外の全パスは `NotFoundPage`（404画面）。
- **認証ガード**: `src/react-app/routes/ProtectedRoute.tsx`（認証必須）と
  `routes/GuestRoute.tsx`（未ログイン専用）の2コンポーネント。どちらも `useMeQuery()` を呼び、
  `isLoading` 中は共通の `components/LoadingScreen.tsx` を表示する。`useMeQuery()` は
  TanStack Query のキャッシュを共有するため、2箇所で呼んでも余分な HTTP リクエストは発生しない。
- **`ProtectedRoute`**: 認証済みの `user`（`User` 型、null 非許容）を `outlet` の
  `context` 経由で子ルート（`routes/HomePage.tsx`・`UserPage`・`MyPage` 等）に渡す。
  子ルート側で `useMeQuery()` を呼び直して `User | null | undefined` を再度絞り込む必要が無い。
- **画面の分担**: `routes/HomePage.tsx` が `Layout` + `RecordsList` を描画し、
  （ヘッダ/FAB と同居するため） `Layout` が `PostRecordModal` を描画する。
  ユーザーページは `features/auth/UserPage.tsx`。`/mypage` は `MyPage.tsx` が自分の
  UserPage へ Navigate する。管理者の通知管理は
  `features/notifications/AdminNotificationsPage.tsx`（プロフィールメニュー「通知管理」）。
  グループ・ユーザー管理は `features/groups/AdminDirectoryPage.tsx`
  （`/admin/groups`、プロフィールメニュー「グループユーザー管理」）。
- **スコープ外**: `GroupSwitcher` が管理する選択中グループ（Zustand の `selectedGroupId`）は
  URL に同期させていない。新しい画面を追加する場合は `routes/router.tsx` にルートを追加し、
  認証要否に応じて `ProtectedRoute` / `GuestRoute` 配下に置くこと。
