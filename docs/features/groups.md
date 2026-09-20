# グループ

所属グループの記録だけ閲覧できる。作成・所属の追加/削除は管理者画面 `/admin/groups`。

## 不変条件

- 所属ユーザー向け API は毎回 `isUserInGroup`
- `GET /api/groups` は所属のみ。管理者の `/api/admin/groups` は所属不問（`requireAdmin`）

## 流れ

`GET /api/groups` → 所属一覧。`GroupSwitcher` が URL・localStorage・所属から選択を解決し、URL・store・storage を一致させる（優先順位は [routing.md](routing.md)）。1 件なら名前表示のみ、2 件以上なら切替（accessible name は `グループ切替`）。

`GET /api/groups/:groupId/members` は所属チェック後に `id` / `displayName` / `avatarKey`。非所属は 403。

## 変更するとき

所属チェックと [api.md](../api.md) の管理者 API を揃える。

## 入口

- `src/worker/routes/groups.ts`
- `src/worker/routes/admin-directory.ts`
- `src/react-app/lib/selectedGroup.ts`
- `src/react-app/features/groups/GroupSwitcher.tsx`
- `src/react-app/stores/uiStore.ts`
