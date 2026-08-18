# グループ機能

[← SKILL.md](../SKILL.md)

- **概要**: ユーザーは1つ以上のグループに所属し、自分が所属するグループのメンバーの記録のみ
  閲覧できる。グループの作成と所属の追加/削除は管理者画面（`/admin/groups`）から行う。
  公開の招待・自己参加 UI は無い。
- **関連ファイル**:
  - Worker: `src/worker/routes/groups.ts`（`GET /api/groups`、所属グループのみ）、
    `src/worker/routes/admin-directory.ts`（`/api/admin/groups` 全件・作成・所属変更）、
    `src/worker/lib/db.ts`の`getGroupsForUser`/`isUserInGroup`/`listAllGroupsWithMembers`/
    `createGroup`/`addGroupMember`/`removeGroupMember`
  - フロント: `src/react-app/features/groups/GroupSwitcher.tsx`、
    `src/react-app/features/groups/AdminDirectoryPage.tsx`（管理者のグループユーザー管理）、
    `src/react-app/queries/useGroups.ts`（`useGroupsQuery`）、
    `src/react-app/queries/useAdminDirectory.ts`、
    選択中グループIDは`src/react-app/stores/uiStore.ts`(Zustand)の`selectedGroupId`
- **データフロー**: `GET /api/groups`（`requireAuth`必須、`index.ts`で
  `app.use("/api/groups/*", requireAuth)`により一括適用）→ `group_members`をJOINして
  自分の所属グループ一覧を取得。フロントは取得後、`GroupSwitcher`が未選択または選択中グループが
  所属から外れていれば自動で先頭グループを選択する（`useEffect`）。所属グループが1件のみなら
  切替UIは出さずグループ名のテキスト表示のみ。2件以上ならドロップダウン（トリガーの
  accessible name は`グループ切替`）で切り替える。
- **注意点**: 記録一覧・投稿API（`records.ts`）は`groupId`ごとに毎回`isUserInGroup`で
  所属チェックを行っている。所属ユーザー向けの新しいグループ関連APIを追加する際も同様の
  所属チェックを忘れないこと（他グループの記録が閲覧・投稿できてしまう権限バグを防ぐため）。
  管理者向け `/api/admin/groups` は所属不問で全グループを返す（`requireAdmin`）。
  `GET /api/groups`（所属のみ）は変更しない。
