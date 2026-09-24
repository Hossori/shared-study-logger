# ルーティング

`createBrowserRouter` + `RouterProvider`（`src/react-app/app/router.tsx`）。採用理由は [design-decisions.md](../design-decisions.md)。

## ルート

- `/login` — `GuestRoute`（ログイン済みなら `/`）
- `/` と `/users/:userId` — `ProtectedRoute`（未ログインなら `/login`）
- `/mypage` — 自分の `/users/:userId` へ Navigate
- `/admin/notifications` と `/admin/groups` — `AdminRoute`（USER は 403 画面）
- その他 — `NotFoundPage`

`ProtectedRoute` / `GuestRoute` は `useMeQuery()`。ロード中は `LoadingScreen`。認証済み `user` は outlet context。ルートは画面と認証境界。

## 選択中グループ（ホーム）

正本は URL と localStorage。`selectedGroupStore.selectedGroupId` は実行時キャッシュ（[state-management.md](state-management.md)）。

- クエリキー `group`。例: `/?group=<id>`
- localStorage キー `selectedGroupId`（定数 `SELECTED_GROUP_STORAGE_KEY`）
- 所属一覧が未取得・失敗のときは URL / storage / store を変更しない。空配列 `[]` のときだけ `null` に揃える
- パス化しない（`/users/:userId` や `/admin/*` を壊さない）
- `/` 以外の画面に `group` クエリは必須にしない
- ロゴ `Link to="/"`（`app/shell/Layout.tsx`）はクエリ無しのまま。ホーム再訪時に localStorage → URL へ寄せる
- `GuestRoute` の `Navigate to="/"` もクエリ無しでよい
- URL 更新は `replace: true`。他の search param は消さない
- `?group=`（空文字）は「URL にグループ無し」

### 解決優先順位

所属 ID 配列に含まれるものだけ有効。無効（欠如・所属外・不明）は次候補へフォールスルー。

```
有効な URL ID ?? 有効な storage ID ?? 所属先頭 ?? null
```

所属が空なら URL / storage の値に関わらず `null`。解決後、ホーム上で URL・store・storage を一致させる。

実装: `src/react-app/features/groups/selectedGroup.ts`（`GroupSwitcher` が配線）。

新しい画面は `router.tsx` に追加し、認証要否に応じてガード配下に置く。

## 入口

- `src/react-app/app/router.tsx`
- `src/react-app/app/guards/ProtectedRoute.tsx`
- `src/react-app/app/guards/GuestRoute.tsx`
- `src/react-app/pages/HomePage.tsx`
- `src/react-app/features/groups/selectedGroup.ts`
