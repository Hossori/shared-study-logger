# 学習記録機能

[← SKILL.md](../SKILL.md)

- **概要**: 学習日時・タイトル・メモ（任意）を投稿し、グループ内で学習日時の新しい順に
  一覧表示する。一覧はカーソルページネーション。自分の記録は編集・削除可能。
  グループメンバーは各記録にスタンプ（👍😊🤣😲😭💪）を付けられる。同一ユーザーが複数種類
  つけられるが、同一スタンプは1回のみ。Pushは出さない。
- **関連ファイル**:
  - Worker: `src/worker/routes/records.ts`（`GET`/`POST /:groupId/records`、
    `PATCH`/`DELETE /:groupId/records/:recordId`、
    `POST`/`DELETE`/`GET /:groupId/records/:recordId/reactions`）、
    `src/worker/lib/db.ts`の`listStudyRecords`/`createStudyRecord`/
    `getStudyRecord`/`updateStudyRecord`/`deleteStudyRecord`/
    `addRecordReaction`/`deleteRecordReaction`/`listRecordReactions`
  - フロント: `src/react-app/features/records/RecordsList.tsx`（一覧表示、「もっと見る」、
    自分の記録の編集・削除UI）、
    `src/react-app/features/records/RecordReactions.tsx`（スタンプピッカー・件数・長押しユーザー一覧）、
    `src/react-app/features/records/PostRecordModal.tsx`（投稿フォーム）、
    `src/react-app/features/records/EditRecordModal.tsx`（編集フォーム）、
    `src/react-app/queries/useRecords.ts`（`useInfiniteQuery`ベースの`useRecordsQuery`、
    `useCreateRecordMutation`/`useUpdateRecordMutation`/`useDeleteRecordMutation`、
    `useAddRecordReactionMutation`/`useDeleteRecordReactionMutation`/`useRecordReactionsQuery`）
  - 共通: `shared/schemas.ts`の`StudyRecordSchema`/`CreateStudyRecordRequestSchema`/
    `UpdateStudyRecordRequestSchema`/`ListStudyRecordsQuerySchema`/
    `ReactionStampSchema`/`REACTION_STAMP_EMOJI`/`REACTION_STAMP_LABEL`/`ReactionSummarySchema`/
    `AddRecordReactionRequestSchema`/`RecordReactionEntrySchema`
- **データフロー**:
  - 一覧取得: `GET /:groupId/records?cursor=...&limit=...` → 所属チェック →
    zodでクエリ検証 → `listStudyRecords`が`study_datetime`+`updated_at`+`id`を複合キーとした
    base64エンコードカーソル（`(study_datetime, updated_at, id)`の辞書順比較）で
    `limit+1`件取得し、`limit`件を超えていれば`nextCursor`を返す。同じページの record id を
    `IN`して`record_reactions`を`GROUP BY record_id, stamp`で1回集計し、各記録の
    `reactions`（`count` / `reactedByMe`、スタンプ定義順）を付ける。フロントは
    `useInfiniteQuery`の`getNextPageParam`で`nextCursor`をそのままページパラメータに使う。
  - 投稿: `POST /:groupId/records` → 所属チェック → zod検証 → `createStudyRecord`でD1へINSERT
    → 投稿者以外の全メンバーIDを`getOtherGroupMemberUserIds`で取得し、1人1メッセージを
    `PUSH_QUEUE`へenqueue（ベストエフォート、失敗しても投稿自体は201で成功させる）→
    フロントは`useCreateRecordMutation`の`onSuccess`で該当グループの一覧クエリキーを
    `invalidateQueries`し自動で再取得させる。レスポンスの`record.reactions`は空配列。
  - 編集: `PATCH /:groupId/records/:recordId` → 所属チェック → 記録取得 → 投稿者チェック
    （`record.userId === user.id`）→ zod検証 → `updateStudyRecord`でUPDATE（`updated_at`更新）→
    フロントは`EditRecordModal`から`useUpdateRecordMutation`で呼び出し、成功時に一覧を
    invalidate。
  - 削除: `DELETE /:groupId/records/:recordId` → 所属チェック → 記録取得 → 投稿者チェック →
    `deleteStudyRecord`でDELETE（`record_reactions`は FK CASCADE）→ フロントは確認ダイアログ後に
    `useDeleteRecordMutation`で呼び出し、成功時に一覧をinvalidate。
  - スタンプ付与: `POST /:groupId/records/:recordId/reactions` `{ stamp }` → 所属チェック →
    記録存在確認 → zod検証 → UNIQUE（record_id, user_id, stamp）重複は 409
    `{ error: "already_reacted" }`。成功時 201。フロントは mutation の `onMutate` で
    一覧キャッシュの件数 / `reactedByMe` を楽観更新し、失敗時はスナップショットへ戻す。
    `onSettled` で一覧とユーザー一覧を invalidate。自分の投稿にも付けられる。
    同種が1件のときは件数バッジを出さない。
  - スタンプ取消: `DELETE /:groupId/records/:recordId/reactions/:stamp` → 所属チェック →
    自分の行だけ DELETE。無ければ 404。カード上のスタンプはクリックでトグル（未付与なら付与、
    自分が付けていれば取消）。件数は1件のとき非表示、2件以上は数字。自分が付けたスタンプは
    枠付きで区別する。
  - ユーザー一覧: `GET /:groupId/records/:recordId/reactions` → `{ stamp, userId, displayName }`
    を `created_at, id` 昇順。フロントは付与済みスタンプの長押しでポップアップを開き、
    そのときだけ `useQuery`。各行は表示名と絵文字。リストアイコンは出さない。
- **注意点・既知の制約**:
  - 編集・削除は投稿者本人のみ可能（グループ所属だけでは不可）。他人の記録には
    フロントでも操作UIを出さない（`useMeQuery`の`user.id`と`record.userId`を比較）。
  - リアクションはグループメンバーなら自分の投稿にも付けられる。スタンプ付与では Push を出さない
    （投稿時の既存 Push は変更しない）。
  - 編集・削除時にPush通知は送らない（投稿時のみ）。
  - `RecordsList.tsx`のレスポンシブ対応はTailwindの`sm:`ブレークポイントで単一コンポーネント
    内に両レイアウトを表現する方針（デバイス別の別実装は作らない、`Layout.tsx`も同様）。
