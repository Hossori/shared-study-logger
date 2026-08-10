# コードを変更する際に注意すべき設計判断

[← SKILL.md](../SKILL.md)

大きな技術選定・アーキテクチャ変更の前に確認すること。コメントに経緯が無い箇所もある。
各項目は採用理由（1〜2文）とやってはいけないこと。

### Hono / D1を維持

Python Workers(FastAPI)は無料プランのCPU制限・コールドスタート・ツールチェーン二重化で不利。PostgreSQL(Hyperdrive)はエッジ恩恵が薄れ運用対象が増えるため見送り、D1(SQLite)を維持。
**しないこと**: FastAPIやPostgresへの置き換えを、この検討済み判断を無視して進める。

### Zustand + TanStack Queryの併用

Zustandだけではサーバー状態キャッシュが無いため意図的に併用する（役割分担は[state-management.md](state-management.md)）。
**しないこと**: サーバーデータをZustandに寄せる、どちらか一方に無理に統一する。

### `injectManifest`（`generateSW`ではない）

`push`/`notificationclick`/`pushsubscriptionchange`の独自イベントハンドリングが必要なため採用。
**しないこと**: PWA設定を`generateSW`に戻してカスタムハンドラを失う。

### Push送信をQueueで非同期化

投稿APIのレスポンス自体のCPU時間・サブリクエスト数を圧迫しないための設計。
**しないこと**: 投稿API内でPushを同期送信する（無料プラン制限に抵触しうる）。

### 1人1メッセージのenqueue

1メッセージの送信失敗が他メンバーへの通知に影響しない設計。
**しないこと**: 失敗隔離を壊すバッチまとめ（まとめるなら独立性を維持する）。

### フロントAPIはaxios（`api.ts`）

学習目的で採用。インターセプターで`ApiError`変換・JSONヘッダ付与等を集約。呼び出し側は`apiGet`/`apiPost`/`apiPatch`/`apiDelete`を使い続ける。Worker側は`fetch`/Web標準のまま。
**しないこと**: フロントで素の`fetch`ラッパーに戻す、またはWorkerにaxiosを入れる。

### `react-router` data router

`createBrowserRouter` + `RouterProvider`（パッケージ名は`react-router`）。SPAフォールバックは`assets.not_found_handling: "single-page-application"`。ルート構成は[routing.md](routing.md)、状態まわりは[state-management.md](state-management.md)。
**しないこと**: 手書きの画面切替に戻す。グループ選択（`selectedGroupId`）のURL同期は現状スコープ外（Zustandのまま）。

### Atomic Designはフル採用しない。`components/ui/`のみ

5階層（atoms〜pages）はコンポーネント数が少なく過剰で、分類の恣意性や`features/`ドメイン構成との衝突が起きやすい。ドメイン非依存の汎用UI（Button/FormField/ErrorMessage等）だけ`components/ui/`へ切り出す。
**しないこと**: atoms/molecules等の階層を導入する。データ取得・Zustand・副作用を持つコンポーネントを`components/ui/`に置く。新しいフォーム部品が必要ならまず既存`ui/`を再利用する。
