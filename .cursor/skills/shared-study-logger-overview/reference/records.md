# 学習記録機能

[← SKILL.md](../SKILL.md)

- **概要**: 学習日時・学習時間（任意・分）・タイトル・メモ（任意）を投稿し、グループ内で学習日時の新しい順に
  一覧表示する。一覧はカーソルページネーション。自分の記録は編集・削除可能。
  学習時間はコンボボックスを開くと 10 分刻みのドラムロール、学習時刻はコンボボックスを開くと
  内側 1〜12 / 外側 13〜24 のアナログ時計（時を選ぶと 5 分刻みの分面）で指定する。
- **関連ファイル**:
  - Worker: `src/worker/routes/records.ts`（`GET`/`POST /:groupId/records`、
    `PATCH`/`DELETE /:groupId/records/:recordId`）、
    `src/worker/lib/db.ts`の`listStudyRecords`/`createStudyRecord`/
    `getStudyRecord`/`updateStudyRecord`/`deleteStudyRecord`
  - フロント: `src/react-app/features/records/RecordsList.tsx`（一覧表示、「もっと見る」、
    自分の記録の編集・削除UI）、
    `src/react-app/features/records/PostRecordModal.tsx`（投稿フォーム）、
    `src/react-app/features/records/EditRecordModal.tsx`（編集フォーム）、
    `src/react-app/features/records/RecordFormFields.tsx`（日時アナログ時計・学習時間ドラムロール。いずれもコンボボックスから開く）、
    `src/react-app/queries/useRecords.ts`（`useInfiniteQuery`ベースの`useRecordsQuery`、
    `useCreateRecordMutation`/`useUpdateRecordMutation`/`useDeleteRecordMutation`）
  - 共通: `shared/schemas.ts`の`StudyRecordSchema`/`CreateStudyRecordRequestSchema`/
    `UpdateStudyRecordRequestSchema`/`ListStudyRecordsQuerySchema`
- **データフロー**:
  - 一覧取得: `GET /:groupId/records?cursor=...&limit=...` → 所属チェック →
    zodでクエリ検証 → `listStudyRecords`が`study_datetime`+`updated_at`+`id`を複合キーとした
    base64エンコードカーソル（`(study_datetime, updated_at, id)`の辞書順比較）で
    `limit+1`件取得し、`limit`件を超えていれば`nextCursor`を返す。フロントは
    `useInfiniteQuery`の`getNextPageParam`で`nextCursor`をそのままページパラメータに使う。
  - 投稿: `POST /:groupId/records` → 所属チェック → zod検証 → `createStudyRecord`でD1へINSERT
    → 投稿者以外の全メンバーIDを`getOtherGroupMemberUserIds`で取得し、1人1メッセージを
    `PUSH_QUEUE`へenqueue（ベストエフォート、失敗しても投稿自体は201で成功させる）→
    フロントは`useCreateRecordMutation`の`onSuccess`で該当グループの一覧クエリキーを
    `invalidateQueries`し自動で再取得させる。
  - 編集: `PATCH /:groupId/records/:recordId` → 所属チェック → 記録取得 → 投稿者チェック
    （`record.userId === user.id`）→ zod検証 → `updateStudyRecord`でUPDATE（`updated_at`更新）→
    フロントは`EditRecordModal`から`useUpdateRecordMutation`で呼び出し、成功時に一覧を
    invalidate。
  - 削除: `DELETE /:groupId/records/:recordId` → 所属チェック → 記録取得 → 投稿者チェック →
    `deleteStudyRecord`でDELETE → フロントは`window.confirm`後に`useDeleteRecordMutation`で
    呼び出し、成功時に一覧をinvalidate。
- **注意点・既知の制約**:
  - 編集・削除は投稿者本人のみ可能（グループ所属だけでは不可）。他人の記録には
    フロントでも操作UIを出さない（`useMeQuery`の`user.id`と`record.userId`を比較）。
  - 編集・削除時にPush通知は送らない（投稿時のみ）。
  - `RecordsList.tsx`のレスポンシブ対応はTailwindの`sm:`ブレークポイントで単一コンポーネント
    内に両レイアウトを表現する方針（デバイス別の別実装は作らない、`Layout.tsx`も同様）。
