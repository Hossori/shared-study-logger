# 状態管理

| 種類                                            | 置き場所                                                                                                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API から取得する / サーバーに保存するデータ     | TanStack Query（各 `features/*/api/`）                                                                                                                                                                     |
| アプリ全体の設定                                | Zustand `stores/preferencesStore.ts`。正本は `localStorage`。未保存のテーマは OS。純関数は `lib/theme.ts`。初回描画前のクラスは `index.html`                                                               |
| 機能のクライアント状態                          | その feature の Zustand。選択グループの実行時キャッシュは `features/groups/selectedGroupStore.ts`。通知 dismiss は `notificationStore.ts`。Push 許可はブラウザ Permission を `useNotificationOptIn` が持つ |
| 画面ローカルの一時 UI（モーダル、記録フィルタ） | コンポーネント state                                                                                                                                                                                       |
| 選択中グループ                                  | URL（ホームの `group` クエリ）+ `localStorage`（[routing.md](routing.md)）。`selectedGroupStore` は実行時キャッシュ                                                                                        |

新しいサーバー状態は、その feature の `api/` に hook を足す。ミューテーション成功時は自分のクエリを `invalidateQueries` する。他 feature のキャッシュを無効化する処理は `pages` か `app` に置く。記録フィルタは一覧コンポーネントの state。

HTTP の集約は `src/react-app/lib/api.ts`。

## 入口

- `src/react-app/stores/preferencesStore.ts`
- `src/react-app/lib/theme.ts`
- `src/react-app/lib/api.ts`
- `src/react-app/features/groups/selectedGroup.ts`
