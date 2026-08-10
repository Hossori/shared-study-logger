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
  ログイン/ログアウト時の`authQueryKeys.me`への`setQueryData`のみ。`queryFn`/`mutationFn`は
  実際のHTTP通信を`src/react-app/lib/api.ts`の`apiGet`/`apiPost`/`apiDelete`
  （axiosの`instance`をラップした薄い関数）に委譲しており、`queries/*.ts`側はaxios自体を
  意識しない（採用理由は[design-decisions.md](design-decisions.md)参照）。
- **役割分担の指針**: 「APIから取得する/サーバーに保存されるデータ」はTanStack Query、
  「UIの一時的な見た目・操作状態」はZustand、という基準で迷ったら判断する。新機能追加時も
  この分担を踏襲すること（例: 新しいAPIリソースを追加する場合は`queries/`に新しいhookを
  作り、Zustandストアにサーバーデータを持たせない）。
- **ルーティング（`react-router` v7系、data router API）**: `App.tsx`は
  `RouterProvider`（`src/react-app/routes/router.tsx`の`createBrowserRouter`定義）を
  描画するだけの薄いラッパーになっている。採用理由・見送った代替案は
  [design-decisions.md](design-decisions.md)参照。
  - ルート構成: `/login`（`GuestRoute`配下、ログイン済みなら`/`へリダイレクト）、`/`
    （`ProtectedRoute`配下、未ログインなら`/login`へリダイレクト）、それ以外の全パスは
    `NotFoundPage`（404画面）。
  - 認証ガードは`src/react-app/routes/ProtectedRoute.tsx`（認証必須ルート用）と
    `routes/GuestRoute.tsx`（未ログイン専用ルート用）の2コンポーネントに分離している。
    どちらも`useMeQuery()`を呼び、`isLoading`中は共通の`components/LoadingScreen.tsx`を
    表示する（旧`App.tsx`の分岐をそのまま踏襲）。`useMeQuery()`はTanStack Queryの
    キャッシュを共有するため、2箇所で呼んでも余分なHTTPリクエストは発生しない。
  - `ProtectedRoute`は認証済みの`user`（`User`型、null非許容）を`Outlet`の
    `context`経由で子ルート（`routes/HomePage.tsx`）に渡す。子ルート側で
    `useMeQuery()`を呼び直して`User | null | undefined`を再度絞り込む必要が無いのが利点。
  - `routes/HomePage.tsx`が旧`App.tsx`のメイン画面部分のうち`Layout` + `RecordsList`
    を引き継ぎ、`PostRecordModal`はヘッダ/FABと同居するため`Layout`側で描画する。
    `features/`配下の各コンポーネント自体は
    無変更。
  - スコープ外: `GroupSwitcher`が管理する選択中グループ（Zustandの`selectedGroupId`）は
    URLに同期させていない（既存のZustand管理のまま）。新しい画面を追加する場合は
    `routes/router.tsx`にルートを追加し、認証要否に応じて`ProtectedRoute`/`GuestRoute`
    配下に置くこと。
