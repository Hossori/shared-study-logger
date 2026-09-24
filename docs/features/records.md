# 学習記録

学習日時・学習時間（任意）・タイトル・メモを投稿し、グループ内で終了時刻（`study_datetime` + `duration_minutes`、NULL duration は 0 分）の新しい順に一覧する。カーソルページネーション。編集・削除は投稿者本人。

API のペア規則・カーソルは [api.md](../api.md)。

## 不変条件

- 編集・削除は `record.userId === user.id`
- `studyDatetime` は常に保存される（未指定時は `created_at`）。`durationMinutes` は NULL 可（終了時間なし）
- スタンプはグループメンバーが付与できる。同一ユーザー×同一スタンプは UNIQUE。付与時に Push は出さない
- 引っ張って更新は `sm` 未満のみ。縦スクロールは Layout の `data-layout-scroll` 1 本

## 流れ

一覧: `GET .../records?cursor&limit&userIds` → 所属チェック → `listStudyRecords`。カーソルは base64 の `sortKey|id`。同じページのリアクションを集計して返す。フロントは `useInfiniteQuery`。フィルタはコンポーネント state（全員 / 自分のみ / 指定する）。

投稿: `POST` → INSERT → 他メンバーへ `PUSH_QUEUE` を 1 人 1 メッセージ（失敗しても 201）。フロントは一覧を invalidate。

編集・削除: 所属 + 投稿者チェック。削除時 `record_reactions` は CASCADE。Push は出さない。

スタンプ: POST で付与（重複 409 `already_reacted`）、DELETE で取消。一覧キャッシュを楽観更新し、`onSettled` で invalidate。長押しでユーザー一覧（`created_at, id` 昇順）。

PTR: ホーム画面の `PullToRefresh` が `recordsQueryKeys.list(groupId)` を invalidate。ジェスチャの純関数は `src/react-app/app/shell/pullRefresh.ts` / `pullGesture.ts`。

## 変更するとき

スキーマは `shared/schemas.ts`。画面契約なら `pnpm test:e2e`。API なら `pnpm test:worker`。[testing.md](../testing.md)。

## 入口

- `src/worker/routes/records.ts`
- `src/react-app/features/records/list/RecordsList.tsx`
- `src/react-app/features/records/api/useRecords.ts`
- `src/react-app/app/shell/PullToRefresh.tsx`
