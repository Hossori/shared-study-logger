# 学習記録機能

[← SKILL.md](../SKILL.md)

- **概要**: 学習日・タイトル・学習時間（分）・メモ（任意）を投稿し、グループ内で新しい順に
  一覧表示する。一覧はカーソルページネーション。
- **関連ファイル**:
  - Worker: `src/worker/routes/records.ts`（`GET`/`POST /:groupId/records`）、
    `src/worker/lib/db.ts`の`listStudyRecords`/`createStudyRecord`
  - フロント: `src/react-app/features/records/RecordsList.tsx`（一覧表示、「もっと見る」）、
    `src/react-app/features/records/PostRecordModal.tsx`（投稿フォーム）、
    `src/react-app/queries/useRecords.ts`（`useInfiniteQuery`ベースの`useRecordsQuery`、
    `useCreateRecordMutation`）
  - 共通: `shared/schemas.ts`の`StudyRecordSchema`/`CreateStudyRecordRequestSchema`/
    `ListStudyRecordsQuerySchema`
- **データフロー**:
  - 一覧取得: `GET /:groupId/records?cursor=...&limit=...` → 所属チェック →
    zodでクエリ検証 → `listStudyRecords`が`created_at`+`id`を複合キーとした
    base64エンコードカーソル（`(created_at, id) < (cursor.created_at, cursor.id)`の比較）で
    `limit+1`件取得し、`limit`件を超えていれば`nextCursor`を返す。フロントは
    `useInfiniteQuery`の`getNextPageParam`で`nextCursor`をそのままページパラメータに使う。
  - 投稿: `POST /:groupId/records` → 所属チェック → zod検証 → `createStudyRecord`でD1へINSERT
    → 投稿者以外の全メンバーIDを`getOtherGroupMemberUserIds`で取得し、1人1メッセージを
    `PUSH_QUEUE`へenqueue（ベストエフォート、失敗しても投稿自体は201で成功させる）→
    フロントは`useCreateRecordMutation`の`onSuccess`で該当グループの一覧クエリキーを
    `invalidateQueries`し自動で再取得させる。
- **注意点・既知の制約**:
  - 記録の編集・削除APIは実装されていない（投稿のみ）。
  - `RecordsList.tsx`のレスポンシブ対応はTailwindの`sm:`ブレークポイントで単一コンポーネント
    内に両レイアウトを表現する方針（デバイス別の別実装は作らない、`Layout.tsx`も同様）。
