# フロント側の状態管理方針

[← SKILL.md](../SKILL.md)

- **Zustand（`src/react-app/stores/uiStore.ts`）**: クライアント状態専用。
  `selectedGroupId`（選択中グループ）、`isPostModalOpen`（投稿モーダル開閉）、
  `notificationStatus`を管理。サーバーから取得したデータをZustandに複製して持たない。
  ライト / ダークの明示選択は Zustand ではなく `localStorage`（`src/react-app/lib/theme.ts`）
  に保存する。未保存時は `prefers-color-scheme` に従う。
- **TanStack Query（`src/react-app/queries/*.ts`）**: サーバー状態専用。認証状態
  （`useAuth.ts`）、グループ一覧（`useGroups.ts`）、記録一覧・投稿
  （`useRecords.ts`、`useInfiniteQuery`）、Push購読状態（`usePushSubscription.ts`）、
  アプリ内通知（`useNotifications.ts`）の
  fetch・キャッシュ・invalidateをすべてここに集約する。ミューテーション成功時は関連する
  クエリキーを`invalidateQueries`して再取得させる方式で、キャッシュを手動で書き換える箇所は
  ログイン/ログアウト時およびプロフィール更新時の`authQueryKeys.me`への`setQueryData`と、
  リアクション付与/取消の件数楽観更新（`recordsQueryKeys.list` の infinite cache。失敗時は
  `onMutate` のスナップショットへ戻し、`onSettled` で invalidate）のみ。
  `queryFn`/`mutationFn`は実際のHTTP通信を`src/react-app/lib/api.ts`の
  `apiGet`/`apiPost`/`apiPatch`/`apiDelete`（axiosの`instance`をラップした薄い関数）に
  委譲しており、`queries/*.ts`側はaxios自体を意識しない（採用理由は
  [design-decisions.md](design-decisions.md)参照）。
- **役割分担の指針**: 「APIから取得する/サーバーに保存されるデータ」はTanStack Query、
  「UIの一時的な見た目・操作状態」はZustand、という基準で迷ったら判断する。新機能追加時も
  この分担を踏襲すること（例: 新しいAPIリソースを追加する場合は`queries/`に新しいhookを
  作り、Zustandストアにサーバーデータを持たせない）。
- **ルーティング**: react-router のルート構成・認証ガードは
  [routing.md](routing.md) を参照。
