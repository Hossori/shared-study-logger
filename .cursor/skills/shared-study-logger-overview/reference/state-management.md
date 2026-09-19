# フロント側の状態管理方針

[← SKILL.md](../SKILL.md)

- **Zustand（`src/react-app/stores/uiStore.ts`、通知 dismiss は `features/notifications/notificationStore.ts`）**:
  画面を跨ぐ・アンマウント後も残すクライアント状態専用。
  `selectedGroupId`（選択中グループ）、`notificationStatus`、通知の `dismissedIds`
  を管理。サーバーから取得したデータをZustandに複製して持たない。
  ライト / ダークの明示選択は Zustand ではなく `localStorage`（`src/react-app/lib/theme.ts`）
  に保存する。未保存時は `prefers-color-scheme` に従う。
- **コンポーネント state**: 画面ローカルの一時 UI。投稿モーダル開閉は
  `RecordsList`、通知モーダル開閉は `HeaderNotifications`、
  記録一覧のユーザーフィルタ（全員 / 自分のみ / 指定する）は一覧側
  （Zustand 禁止）。
- **TanStack Query（`src/react-app/queries/*.ts`）**: サーバー状態専用。認証状態
  （`useAuth.ts`）、グループ一覧（`useGroups.ts`）、記録一覧・投稿
  （`useRecords.ts`、`useInfiniteQuery`）、Push購読状態（`usePushSubscription.ts`）、
  アプリ内通知（`useNotifications.ts`）の
  fetch・キャッシュ・invalidateをすべてここに集約する。ミューテーション成功時は関連する
  クエリキーを`invalidateQueries`して再取得させる方式で、キャッシュを手動で書き換える箇所は
  ログイン/ログアウト時およびプロフィール更新時の`authQueryKeys.me`への`setQueryData`と、
  リアクション付与/取消の件数楽観更新（`recordsQueryKeys.list` prefix への
  `setQueriesData`。失敗時は `onMutate` のスナップショットへ戻し、`onSettled` で invalidate）のみ。
  記録一覧のクエリキーは `recordsQueryKeys.listPage(groupId, sortedUserIds)`。
  `queryFn`/`mutationFn`は実際のHTTP通信を`src/react-app/lib/api.ts`の
  `apiGet`/`apiPost`/`apiPatch`/`apiDelete`（axiosの`instance`をラップした薄い関数）に
  委譲しており、`queries/*.ts`側はaxios自体を意識しない（採用理由は
  [design-decisions.md](design-decisions.md)参照）。
- **役割分担の指針**: 「APIから取得する/サーバーに保存されるデータ」はTanStack Query、
  「画面を跨ぐ・永続化するクライアント状態」はZustand、
  「モーダル開閉・フィルタなど画面ローカルの一時 UI」はコンポーネント state。
  新機能追加時もこの分担を踏襲すること（例: 新しいAPIリソースを追加する場合は`queries/`に新しいhookを
  作り、Zustandストアにサーバーデータを持たせない。ダイアログ開閉を Zustand に上げない）。
- **ルーティング**: react-router のルート構成・認証ガードは
  [routing.md](routing.md) を参照。
