# 状態管理

| 種類 | 置き場所 |
| ---- | -------- |
| API から取得する / サーバーに保存するデータ | TanStack Query（`src/react-app/queries/`） |
| 画面を跨ぐクライアント状態 | Zustand（`uiStore.ts`。通知 dismiss は `notificationStore.ts`） |
| 画面ローカルの一時 UI（モーダル、記録フィルタ） | コンポーネント state |
| テーマの明示選択 | `localStorage`（`src/react-app/lib/theme.ts`） |
| 選択中グループ | URL（ホームの `group` クエリ）+ `localStorage`（[routing.md](routing.md)）。`uiStore.selectedGroupId` は実行時キャッシュ |

新しいサーバー状態は `queries/` に hook を足す。ミューテーション成功時は関連クエリを `invalidateQueries` する。記録フィルタは一覧コンポーネントの state。

HTTP の集約は `src/react-app/lib/api.ts`。

## 入口

- `src/react-app/stores/uiStore.ts`
- `src/react-app/queries/`
- `src/react-app/lib/api.ts`
- `src/react-app/lib/selectedGroup.ts`
