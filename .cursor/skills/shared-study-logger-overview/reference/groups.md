# グループ機能

[← SKILL.md](../SKILL.md)

- **概要**: ユーザーは1つ以上のグループに所属し、自分が所属するグループのメンバーの記録のみ
  閲覧できる。グループ作成/招待UIは無い（MVPスコープ外、DBへ直接投入する想定）。
- **関連ファイル**:
  - Worker: `src/worker/routes/groups.ts`（`GET /api/groups`）、
    `src/worker/lib/db.ts`の`getGroupsForUser`/`isUserInGroup`
  - フロント: `src/react-app/features/groups/GroupSwitcher.tsx`、
    `src/react-app/queries/useGroups.ts`（`useGroupsQuery`）、
    選択中グループIDは`src/react-app/stores/uiStore.ts`(Zustand)の`selectedGroupId`
- **データフロー**: `GET /api/groups`（`requireAuth`必須、`index.ts`で
  `app.use("/api/groups/*", requireAuth)`により一括適用）→ `group_members`をJOINして
  自分の所属グループ一覧を取得。フロントは取得後、`GroupSwitcher`が未選択または選択中グループが
  所属から外れていれば自動で先頭グループを選択する（`useEffect`）。所属グループが1件のみなら
  `<select>`ではなくグループ名のテキスト表示のみ。
- **注意点**: 記録一覧・投稿API（`records.ts`）は`groupId`ごとに毎回`isUserInGroup`で
  所属チェックを行っている。新しいグループ関連APIを追加する際も同様の所属チェックを忘れないこと
  （他グループの記録が閲覧・投稿できてしまう権限バグを防ぐため）。
