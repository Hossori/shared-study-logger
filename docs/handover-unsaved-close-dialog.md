# 引継ぎ: フォームダイアログの未保存クローズ確認

対象はダイアログ対応のみ。読み込み中表示の検討は含まない。

## 現状

`develop` には **入っていない**。一度マージしたあと、Revert されている。

| 項目 | 内容 |
| ---- | ---- |
| 実装ブランチ | `cursor/dialog-unsaved-confirm-081f` |
| 実装 PR | https://github.com/Hossori/shared-study-logger/pull/28 （MERGED） |
| Revert PR | https://github.com/Hossori/shared-study-logger/pull/29 （MERGED） |
| 現在の `origin/develop` | `fc130b3`（#29 のマージ） |
| 復元の基点 | `62cd2b0`（#28 のマージコミット）またはブランチ `cursor/dialog-unsaved-confirm-081f` の `35bdf0f` |

追加修正する場合は、現行の `origin/develop` から新しいブランチを切り、#28 の差分を載せ直して直す。

```bash
git fetch origin
git checkout origin/develop
git checkout -b cursor/<name>-081f   # または feature/ プレフィックス（チーム規約に合わせる）
git cherry-pick 0b54ab9 35bdf0f
# もしくは git checkout 35bdf0f -- <files>
```

コミット:

1. `0b54ab9` feat: フォームダイアログを閉じる前に未保存確認を出す
2. `35bdf0f` fix: 未保存確認中に親ダイアログへクリックが届かないようにする

## 依頼内容

ダイアログを閉じるとき、ダイアログ内で **いずれかの値を一度でも編集した** 場合は確認ダイアログを出す。

「初期値と違う」ではなく「編集操作が一度でもあったか」で判定する。

## 仕様（実装した挙動）

- 未編集なら、キャンセル / × / オーバーレイ / Escape ですぐ閉じる。
- 一度でも編集したあとに閉じようとすると、「編集内容を破棄しますか？」を出す。
  - 「編集に戻る」: フォームは開いたまま、入力は残す。
  - 「破棄する」: フォームを閉じる。
- 投稿・保存・パスワード変更が **成功して** `onClose()` する経路では確認を出さない。

対象:

- 学習記録の投稿（`PostRecordModal` → `RecordModalShell`）
- 学習記録の編集（`EditRecordModal` → `RecordModalShell`）
- プロフィール編集（`EditProfileModal`、アバター変更も含む）
- パスワード変更（`ChangePasswordModal`）

対象外（入力フォームではないため未接続）:

- 通知一覧（`NotificationModal`）
- PWA / クライアント更新確認（`ServiceWorkerUpdateDialog`）
- 削除・ログアウトなどの既存確認（`useConfirm` / `ConfirmProvider`）

確認ダイアログの文言（`UNSAVED_CLOSE_CONFIRM`）:

- タイトル: 編集内容を破棄しますか？
- 本文: 入力した内容は保存されません。
- 確定: 破棄する（danger）
- キャンセル: 編集に戻る

## 設計

グローバルな `useConfirm()` は使っていない。`ConfirmProvider` の確認は App 直下の兄弟で、フォーム `Dialog` の **入れ子** にならない。Base UI の nested dialog（Escape の topmost、inert）に乗せるため、確認 UI は親 `Dialog` の子として描画する。

判定ロジックは純関数に切り出して unit している。

```ts
resolveUnsavedCloseRequest({ dirty, confirming })
// dirty=false, confirming=false → "close"
// dirty=true,  confirming=false → "confirm"
// confirming=true              → "ignore"（再入防止。親の close は cancel()）
```

dirty の付け方:

- `<form onInput={markDirty} onChange={markDirty}>`（キー入力など）
- プロフィールのアバター選択 / 「デフォルトに戻す」はボタンなので、そこだけ `markDirty()` を明示呼び出し

閉じるときの流れ:

1. `Dialog` の `onOpenChange(false, eventDetails)` またはキャンセルボタンの `requestClose()`
2. dirty なら `eventDetails.cancel()` して親を閉じない → 確認を開く
3. 破棄なら `onClose()`、戻るなら何もしない

入れ子時のクリック制御（2つ目のコミット）:

- 親 `Dialog` の Popup に `data-[nested-dialog-open]:pointer-events-none`
- `AlertDialog` オーバーレイに `forceRender`（入れ子だと通常は backdrop が出ない）
- AlertDialog の overlay / content を `z-[60]`（親 Dialog は `z-50`）

`open` が切り替わったら dirty / 確認状態をリセットする。親が閉じている間は確認を出さない（`open && confirmOpen`）。

## ファイル

新規:

- `src/react-app/lib/unsavedCloseGuard.ts` — 文言と `resolveUnsavedCloseRequest`
- `src/react-app/components/useUnsavedCloseGuard.tsx` — フック。`confirmNode` を親 Dialog 内に置く
- `tests/unit/unsavedCloseGuard.test.ts`

接続:

- `src/react-app/features/records/RecordModalShell.tsx`
- `src/react-app/features/auth/EditProfileModal.tsx`
- `src/react-app/features/auth/ChangePasswordModal.tsx`

共通 UI（確認の重ね順用）:

- `src/react-app/components/ui/dialog.tsx` — nested 時 `pointer-events-none`
- `src/react-app/components/ui/alert-dialog.tsx` — `forceRender` と `z-[60]`

E2E:

- `e2e/smoke.spec.ts` の「学習記録を投稿できる」に手順を追加（テスト本数は 7 のまま）
  - 未編集でキャンセル → すぐ閉じる
  - タイトル入力後キャンセル → 確認 → 編集に戻る（値が残る）
  - 再度キャンセル → 破棄する → 閉じる
  - その後、従来どおり投稿できること

## 検証（当時）

ローカル:

- `pnpm lint` / `pnpm run typecheck` / `pnpm test` / `pnpm run format:check` 成功
- `pnpm test:e2e` 7件成功

CI（#28）:

- Quality / Unit tests / Worker tests / E2E smoke 成功

## 再開時の受け入れ条件

- 未編集クローズは確認なし
- 一度でも編集したクローズは確認あり
- 「編集に戻る」で入力が残る
- 「破棄する」でフォームが閉じる
- 保存成功のクローズは確認なし
- 投稿 / 編集 / プロフィール / パスワード変更に入っている
- 通知モーダルなど非フォームには入れない
- 上記の lint / typecheck / unit / e2e が通る
