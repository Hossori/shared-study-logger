# フロント側の状態管理方針

[← SKILL.md](../SKILL.md)

- **Zustand（`src/react-app/stores/uiStore.ts`）**: クライアント状態専用。
  `selectedGroupId`（選択中グループ）、`isPostModalOpen`（投稿モーダル開閉）、
  `notificationStatus`を管理。サーバーから取得したデータをZustandに複製して持たない。
- **TanStack Query（`src/react-app/queries/*.ts`）**: サーバー状態専用。認証状態
  （`useAuth.ts`）、グループ一覧（`useGroups.ts`）、記録一覧・投稿
  （`useRecords.ts`、`useInfiniteQuery`）、Push購読状態（`usePushSubscription.ts`）の
  fetch・キャッシュ・invalidateをすべてここに集約する。ミューテーション成功時は関連する
  クエリキーを`invalidateQueries`して再取得させる方式で、キャッシュを手動で書き換える箇所は
  ログイン/ログアウト時の`authQueryKeys.me`への`setQueryData`のみ。
- **役割分担の指針**: 「APIから取得する/サーバーに保存されるデータ」はTanStack Query、
  「UIの一時的な見た目・操作状態」はZustand、という基準で迷ったら判断する。新機能追加時も
  この分担を踏襲すること（例: 新しいAPIリソースを追加する場合は`queries/`に新しいhookを
  作り、Zustandストアにサーバーデータを持たせない）。
- ルーティングライブラリは未導入（画面がログイン画面とメイン画面の2つのみのため、
  認証状態による条件分岐で切り替えている。`App.tsx`参照）。
