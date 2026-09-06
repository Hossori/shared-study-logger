# コードを変更する際に注意すべき設計判断

[← SKILL.md](../SKILL.md)

大きな技術選定・アーキテクチャ変更の前に確認すること。

### Hono / D1を維持

Python Workers(FastAPI)は無料プランのCPU制限・コールドスタート・ツールチェーン二重化で不利。PostgreSQL(Hyperdrive)はエッジ恩恵が薄れ運用対象が増えるため見送り、D1(SQLite)を維持。

### Zustand + TanStack Queryの併用

Zustandだけではサーバー状態キャッシュが無いため意図的に併用する（役割分担は[state-management.md](state-management.md)）。

### `injectManifest`（`generateSW`ではない）

`push`/`notificationclick`/`pushsubscriptionchange`の独自イベントハンドリングが必要なため採用。
**しないこと**: PWA設定を`generateSW`に戻してカスタムハンドラを失う。

### Push送信をQueueで非同期化

投稿APIのレスポンス自体のCPU時間・サブリクエスト数を圧迫しないための設計。
**しないこと**: 投稿API内でPushを同期送信する（無料プラン制限に抵触しうる）。

### 1人1メッセージのenqueue

1メッセージの送信失敗が他メンバーへの通知に影響しない設計。

### フロントAPIはaxios（`api.ts`）

学習目的で採用。インターセプターで`ApiError`変換・JSONヘッダ付与等を集約。呼び出し側は`apiGet`/`apiPost`/`apiPatch`/`apiDelete`を使い続ける。Worker側は`fetch`/Web標準のまま。

### `react-router` data router

`createBrowserRouter` + `RouterProvider`（パッケージ名は`react-router`）。SPAフォールバックは`assets.not_found_handling: "single-page-application"`。ルート構成は[routing.md](routing.md)、状態まわりは[state-management.md](state-management.md)。

### Atomic Designはフル採用しない。`components/ui/`のみ

5階層（atoms〜pages）はコンポーネント数が少なく過剰で、分類の恣意性や`features/`ドメイン構成との衝突が起きやすい。ドメイン非依存の汎用UI（Button/FormField/ErrorMessage等）だけ`components/ui/`へ切り出す。
例: 確認ダイアログの見た目（`ConfirmDialog`）は`ui/`、Context / Promise 解決を持つ`ConfirmProvider`と`useConfirm`は`components/`直下。

### オーバーレイ: Dialog / Drawer / AlertDialog

記録・プロフィール・パスワード・ConfirmDialog などは `Dialog` の CSS 下端ボトムシート（`sm` 未満）を維持する。アプリ内通知だけモバイルで Base UI `Drawer`（スナップ 0.5 / 1）に分岐し、高さ変更をスワイプで行う。`AlertDialog` は常にビューポート中央。

### テーマは `html.dark` + localStorage

shadcn / Tailwind のセマンティックカラー（`:root` と `.dark`）に合わせ、クラス戦略で切替える。未保存時だけ `prefers-color-scheme` に追従し、トグル後は `localStorage` の明示値を優先する。FOUC 防止の初期化は `index.html` のインラインスクリプトと `src/react-app/lib/theme.ts` でキーを揃える。
