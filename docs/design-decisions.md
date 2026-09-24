# 設計判断

大きな技術選定・アーキテクチャ変更の前に確認する。

### Hono / D1 を維持

Python Workers（FastAPI）は無料プランの CPU 制限・コールドスタート・ツールチェーン二重化で不利。PostgreSQL（Hyperdrive）はエッジ恩恵が薄れ運用対象が増えるため、D1（SQLite）を維持する。

### Zustand + TanStack Query の併用

サーバー状態のキャッシュが必要なため併用する。役割分担は [features/state-management.md](features/state-management.md)。

### Service Worker は `injectManifest`

`push` / `notificationclick` / `pushsubscriptionchange` の独自ハンドラが必要なため。`generateSW` に戻すとこれらのハンドラが失われる。

### Push は Queue で非同期

投稿 API の CPU・サブリクエストを圧迫しないため。送信は `queue()` 側。1 人 1 メッセージにし、1 件の失敗が他メンバーへ波及しないようにする。

### フロント API は axios（`api.ts`）

学習目的で採用。インターセプターで `ApiError` 変換・JSON ヘッダ付与を集約する。呼び出し側は `apiGet` / `apiPost` / `apiPatch` / `apiDelete`。Worker 側は `fetch` / Web 標準のまま。

### `react-router` data router

`createBrowserRouter` + `RouterProvider`（パッケージ名は `react-router`）。SPA フォールバックは `assets.not_found_handling: "single-page-application"`。ルート構成は [features/routing.md](features/routing.md)。

### `components/ui/` のみ切り出す

Atomic Design の 5 階層はコンポーネント数が少なく過剰で、`features/` のドメイン構成と衝突しやすい。ドメイン非依存の汎用 UI（Button / FormField / ErrorMessage 等）だけ `components/ui/` へ置く。確認ダイアログの見た目（`ConfirmDialog`）は `ui/`、Context / Promise 解決を持つ `ConfirmProvider` と `useConfirm` は `components/` 直下。

### オーバーレイ: Dialog / Drawer / AlertDialog

記録・プロフィール・パスワード・ConfirmDialog は `Dialog` の CSS 下端ボトムシート（`sm` 未満）。アプリ内通知だけモバイルで Base UI `Drawer`（スナップ 0.5 / 1）に分岐し、高さ変更をスワイプで行う。`AlertDialog` は常にビューポート中央。

### テーマは `html.dark` + localStorage

shadcn / Tailwind のセマンティックカラー（`:root` と `.dark`）に合わせ、クラス戦略で切り替える。未保存時だけ `prefers-color-scheme` に追従し、トグル後は `localStorage` の明示値を優先する。FOUC 防止の初期化は `index.html` のインラインスクリプトと `src/react-app/lib/theme.ts` でキーを揃える。React 側の現在値は `stores/preferencesStore.ts` が同じ純関数で初期化する。

フロントの依存は `app` / `pages` → `features` → `components` / `lib` / `hooks` / `stores`。feature は他 feature を import しない。画面の合成は `pages` と `app/shell` が行う。
