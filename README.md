# 学習記録シェア (shared-study-logger)

グループ単位で学習記録を共有し、メンバーが記録を投稿すると他のメンバーへ Web Push 通知で
知らせる学習記録共有アプリです。Cloudflare Workers 上に単一の Worker（API + 静的アセット配信）
としてデプロイされ、PWA としてスマートフォンのホーム画面にも追加できます。

このプロジェクトの正本ドキュメントは、この `README.md`・
[`.cursor/skills/shared-study-logger-overview/SKILL.md`](.cursor/skills/shared-study-logger-overview/SKILL.md)・
[`docs/data-model.md`](docs/data-model.md)・
`migrations/` 配下のマイグレーションファイル（gitで管理されているもの）です。

## 主な機能

- 固定アカウント方式のログイン／ログアウト（事前に管理者が登録したユーザーのみ利用可能）
- 所属グループの切り替え（複数グループに所属している場合）
- 学習記録の投稿（勉強日時・タイトル・メモ）とカーソルページネーションによる一覧表示
- 記録投稿時、同じグループの他メンバーへ Web Push 通知を送信（Cloudflare Queues 経由）
- PWA 対応（ホーム画面への追加、Service Worker によるオフラインキャッシュ、Push 通知受信）

## 技術スタック

| 分類 | 技術 |
| --- | --- |
| フロントエンド | React 19 + Vite 7、TypeScript |
| 状態管理 | Zustand（UI状態）、TanStack Query（サーバー状態・キャッシュ） |
| API通信 | axios（`src/react-app/lib/api.ts`でinterceptorを使い共通エラーハンドリング） |
| スタイリング | Tailwind CSS v4（`@tailwindcss/vite`）、`clsx`（条件分岐によるクラス名組み立て。`src/react-app/lib/cn.ts`の`cn()`ヘルパー経由で使用） |
| コード整形 | Prettier + `prettier-plugin-tailwindcss`（Tailwindクラスの並び順を自動統一。`pnpm run format` / `pnpm run format:check`） |
| バックエンド | Hono（Cloudflare Workers 上で動作するAPIフレームワーク） |
| インフラ | Cloudflare Workers（単一Worker + Static Assets） |
| データベース | Cloudflare D1（SQLite互換） |
| セッションストア | Cloudflare Workers KV |
| 非同期処理 | Cloudflare Queues（Push通知の非同期配信・DLQ付き） |
| Push通知 | Web Push（VAPID）、`@pushforge/builder` |
| PWA | `vite-plugin-pwa`（`injectManifest`戦略）、Workbox |
| バリデーション | Zod（`shared/schemas.ts`でフロント・バックエンド共通定義） |

## データモデル

D1 のテーブル定義・ER図・インデックス・マイグレーション運用については [docs/data-model.md](docs/data-model.md) を参照。

## ディレクトリ構成（概要）

```
shared-study-logger/
  src/
    worker/            # Hono API + Cloudflare Queuesコンシューマ（バックエンド）
      index.ts           # fetch(Hono app) と queue() をexport
      routes/            # auth / groups / records / push の各エンドポイント
      lib/               # 認証・セッション・DBアクセス・Push送信のヘルパー
      middleware/        # 認証ミドルウェア
      types/env.d.ts     # wrangler typesが生成しないシークレットの型補完
    react-app/         # Reactフロントエンド
      stores/            # Zustand
      queries/           # TanStack Queryフック
      features/          # 認証・グループ切替・記録一覧/投稿・通知UI（ドメイン固有ロジック）
      routes/            # react-router定義・認証ガード(ProtectedRoute/GuestRoute)・404/HomePage
      components/        # 横断的なUI（Layout, LoadingScreen）
      components/ui/     # ドメイン非依存の汎用UI部品（Button, FormField, ErrorMessage）
      lib/               # api.ts(axios) / push.ts / cn.ts(clsxラッパー)
  shared/
    schemas.ts         # Zodスキーマ（Worker/フロント共通）
  migrations/           # D1マイグレーション
  scripts/seed-users.mjs # 初期ユーザー・グループ投入スクリプト
  public/
    sw.ts               # カスタムService Worker（injectManifestのソース）
    manifest.webmanifest
    icons/
  wrangler.jsonc        # D1 / KV / Queue バインディング設定
```

## セットアップ手順（ローカル開発）

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. Cloudflareリソースの準備

このプロジェクトは D1（`shared-study-logger-db`）・KV（`SESSIONS`）・Queue（`push-notifications` /
`push-notifications-dlq`）を利用します。`wrangler.jsonc` に既に本番リソースのIDが設定されていますが、
ローカル開発では `wrangler` がローカルエミュレーション用のSQLite/KVを自動生成するため、追加の準備は不要です。
別環境で作り直す場合は以下を参考にしてください。

```bash
pnpm exec wrangler d1 create shared-study-logger-db
pnpm exec wrangler kv namespace create SESSIONS
pnpm exec wrangler queues create push-notifications
pnpm exec wrangler queues create push-notifications-dlq
# wrangler.jsonc の database_id / kv id を出力内容に置き換える
```

### 3. ローカルD1へのマイグレーション適用

```bash
pnpm exec wrangler d1 migrations apply shared-study-logger-db --local
```

### 4. 環境変数（`.dev.vars`）の設定

プロジェクトルートに `.dev.vars` ファイルを作成し、以下の3つの環境変数を設定します
（`.gitignore` で除外済みのためコミットされません）。

```ini
VAPID_PUBLIC_KEY=（VAPID公開鍵、base64url文字列）
VAPID_PRIVATE_KEY=（VAPID秘密鍵、JWK形式のJSON文字列）
VAPID_ADMIN_CONTACT=mailto:admin@example.com
```

VAPID鍵ペアは `@pushforge/builder` のCLIで生成できます。

```bash
pnpm exec pushforge vapid
```

> 環境変数についての詳細は「環境変数・シークレット一覧」を参照してください。

### 5. サンプルユーザー・グループの投入

```bash
pnpm seed
```

`admin@example.com` / `ChangeMe123!` のサンプル管理者ユーザーと、それが所属する
「サンプル学習グループ」がローカルD1に1件ずつ投入されます。再実行するとメールアドレスの
UNIQUE制約でエラーになるため、再投入したい場合はローカルD1をリセットしてください。

### 6. 開発サーバーの起動

```bash
pnpm dev
```

`http://localhost:5173`（ポートが使用中の場合は`5174`等に自動変更）でアクセスできます。
上記のサンプルアカウントでログインできます。

## 環境変数・シークレット一覧

| 名前 | 用途 | ローカルでの設定方法 | 本番での設定方法 |
| --- | --- | --- | --- |
| `VAPID_PUBLIC_KEY` | Web Push購読(`applicationServerKey`)およびVAPID署名に使う公開鍵 | `.dev.vars` | `wrangler secret put VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | VAPID署名生成に使う秘密鍵（JWK形式、要秘匿） | `.dev.vars` | `wrangler secret put VAPID_PRIVATE_KEY` |
| `VAPID_ADMIN_CONTACT` | VAPID JWTの`sub`クレームに使う連絡先（`mailto:`形式推奨） | `.dev.vars` | `wrangler secret put VAPID_ADMIN_CONTACT` |

`wrangler.jsonc` が生成する `worker-configuration.d.ts` はこれらのシークレット/varsを
型付けしないため、`src/worker/types/env.d.ts` でグローバル`interface Env`の宣言マージにより
型を補完しています（`wrangler types` を再実行しても上書きされません）。

D1・KV・Queueのバインディング（`DB` / `SESSIONS` / `PUSH_QUEUE`）は `wrangler.jsonc` で
設定済みのため、環境変数としての追加設定は不要です。

## ビルド・検証コマンド

```bash
pnpm exec tsc -b     # 型チェック（フロント・バックエンド両方、noEmit）
pnpm run typecheck   # 同上（CI / 品質ゲート用エイリアス）
pnpm build           # tsc -b && vite build（本番ビルド。dist/client にService Worker含む静的アセット、
                     #   dist/shared_study_logger にWorkerバンドルを出力）
pnpm lint            # ESLint
pnpm test            # Vitest unit（tests/unit）
pnpm test:worker     # Workers 統合（tests/worker、@cloudflare/vitest-pool-workers）
pnpm test:e2e        # Playwright スモーク（e2e、≤7本。要 seed。初回 pnpm playwright:install）
pnpm playwright:install # Chromium + headless-shell（%LOCALAPPDATA%\ms-playwright）
pnpm dev             # ローカル開発サーバー（Vite）
pnpm run format:check # Prettier（+ prettier-plugin-tailwindcssによるTailwindクラス並び順）の整形チェック
                       # 対象は src/react-app/**/*.{ts,tsx} と shared/**/*.ts
pnpm run format        # 上記を実際に整形して上書きする
```

テスト方針（ピラミッド・Push/PWA除外・seed/Cookie前提）は
[`.cursor/skills/testing-strategy/SKILL.md`](.cursor/skills/testing-strategy/SKILL.md)。
E2E 前提の短い手順は [`e2e/README.md`](e2e/README.md)。
`pnpm build` では `vite-plugin-pwa`（`injectManifest`戦略）により `public/sw.ts` が
コンパイルされ、`self.__WB_MANIFEST` にプリキャッシュ対象が注入された `dist/client/sw.js` が
生成されます。ビルド時に `sw.mjs`（コンパイル後の生ソース）と `sw.js`（マニフェスト注入後の最終版）の
両方が出力されますが、実際に登録されるのは `sw.js` です（`src/react-app/main.tsx`参照）。

## サンプルログイン情報（開発用）

- email: `admin@example.com`
- password: `ChangeMe123!`

このアプリは固定アカウント方式（自己登録なし）のため、実運用では管理者が
`scripts/seed-users.mjs` を参考にしたスクリプトやSQLでユーザーを事前登録する必要があります。
上記のサンプルパスワードは開発用です。本番投入時は必ず変更してください。

## デプロイ手順（概要）

本番環境へのデプロイは以下の手順で行います。実行にはCloudflareアカウントへの
`wrangler login`（認証）が必要です。

### 1. 本番シークレットの設定

`.dev.vars` と同じ値（または本番用に新規生成した値）を対話プロンプトで入力します。

```bash
pnpm exec wrangler secret put VAPID_PRIVATE_KEY
pnpm exec wrangler secret put VAPID_PUBLIC_KEY
pnpm exec wrangler secret put VAPID_ADMIN_CONTACT
```

ローカルとは別に本番用のVAPID鍵ペアを新規生成する場合は、フロント側で参照している
公開鍵（Push購読時の`applicationServerKey`。`GET /api/push/vapid-public-key`経由で
サーバーから取得しているため、フロントのコード変更は不要）も本番用に切り替わることを確認してください。

### 2. 本番D1マイグレーションの適用

```bash
pnpm exec wrangler d1 migrations apply shared-study-logger-db --remote
```

### 3. 本番シードの投入（任意）

```bash
node scripts/seed-users.mjs --remote
```

サンプルパスワード（`ChangeMe123!`）をそのまま本番で使わないよう、
スクリプト内の値を実運用者向けに変更するか、投入後にパスワードを変更する手段を用意してください。

### 4. デプロイ

```bash
pnpm deploy
```

内部的に `wrangler deploy` を実行し、Workerと静的アセット（`dist/client`）をまとめて
Cloudflareにアップロードします。デプロイ後は発行されたURLで、ログイン〜記録投稿〜
Push通知有効化までのE2E動作確認を行うことを推奨します。

## Cloudflareリソース一覧（本番）

| リソース | 名前 | ID / binding |
| --- | --- | --- |
| D1 | `shared-study-logger-db` | `de455ad0-4b51-491f-aaab-92e456e0ed37`（binding: `DB`） |
| KV | `SESSIONS` | `866cf1c34dda41199499692e4252bb6e`（binding: `SESSIONS`） |
| Queue（producer/consumer） | `push-notifications` | binding: `PUSH_QUEUE` |
| Queue（Dead Letter Queue） | `push-notifications-dlq` | `push-notifications`コンシューマの`dead_letter_queue`として設定 |

## Push通知・VAPID鍵について

- Web Push通知は [VAPID](https://datatracker.ietf.org/doc/html/rfc8292)（Voluntary Application
  Server Identification）方式で送信しており、`@pushforge/builder` を使って署名・送信しています。
- 記録投稿時（`POST /api/groups/:groupId/records`）、投稿者以外の同グループメンバー全員に対して
  1人1メッセージを `PUSH_QUEUE`（Cloudflare Queues）へenqueueし、`queue()`ハンドラが非同期で
  実際のPush送信を行います（ベストエフォート。送信失敗はDLQへ）。
- 購読先エンドポイントが410/404を返した場合（ブラウザ側で購読が失効した場合）、該当の
  `push_subscriptions`レコードをD1から自動削除します。
- iOSでPush通知を利用するには、PWAをホーム画面に追加（standaloneモード）する必要があります。
  `NotificationOptIn`コンポーネントはUser-AgentベースでiOS Safari（非standalone）を検出し、
  ホーム画面への追加を案内します。

## 既知の注意点・制約

- 認証Cookie（`session`）は本番（HTTPS配信）では`Secure`属性付きで発行されます。ローカル開発
  （`http://localhost`）でもログインCookieが保存されるよう、`Secure`属性はリクエストURLの
  プロトコル判定で動的に切り替えています（本番の挙動には影響しません）。
- iOS実機でのホーム画面追加・Push受信確認は開発環境の制約により未実施です。実運用前に実機での
  最終確認を推奨します。
