# ルーティング

`createBrowserRouter` + `RouterProvider`（`src/react-app/routes/router.tsx`）。採用理由は [design-decisions.md](../design-decisions.md)。

## ルート

- `/login` — `GuestRoute`（ログイン済みなら `/`）
- `/` と `/users/:userId` — `ProtectedRoute`（未ログインなら `/login`）
- `/mypage` — 自分の `/users/:userId` へ Navigate
- `/admin/notifications` と `/admin/groups` — `AdminRoute`（USER は 403 画面）
- その他 — `NotFoundPage`

`ProtectedRoute` / `GuestRoute` は `useMeQuery()`。ロード中は `LoadingScreen`。認証済み `user` は outlet context。選択中グループはいま `uiStore.selectedGroupId`（[state-management.md](state-management.md)）。ルートは画面と認証境界。

### 次の変更（趣旨）

選択中グループを **URL と localStorage の両方** に持つ。リロード・再訪・リンクで同じグループに戻せるようにする。詳細（クエリ vs パス、キー名、e2e）は別作業。

- URL にグループがあるときはそれを使う
- 無いときは localStorage、それも無ければ所属の先頭
- 所属外・不明な ID は先頭へ寄せ、URL・store・storage を一致させる
- 所属 1 件のときは切替 UI を出さない（現行どおり）

新しい画面は `router.tsx` に追加し、認証要否に応じてガード配下に置く。

## 入口

- `src/react-app/routes/router.tsx`
- `src/react-app/routes/ProtectedRoute.tsx`
- `src/react-app/routes/GuestRoute.tsx`
- `src/react-app/routes/HomePage.tsx`
