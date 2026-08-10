# コードを変更する際に注意すべき設計判断

[← SKILL.md](../SKILL.md)

以下は実装前に検討し、見送った代替案とその判断理由の一覧。コードやコメントにこれらの
経緯が書かれていない箇所もあるため、大きな技術選定・アーキテクチャ変更を提案・実装する前に
必ずここを確認すること。

- **Hono / D1を維持（FastAPI・PostgreSQLへの変更は見送り済み）**: Python Workers(FastAPI)は
  技術的に可能だが無料プランのCPU時間制限に対して不利かつコールドスタートが重く、
  ツールチェーンも二重化するため見送り。PostgreSQL(Hyperdrive経由)もエッジ配置の恩恵が薄れ
  運用対象が増えるため見送り、D1(SQLite)を維持している。**これらの技術選定を変更する提案を
  実装する際は、まずこの判断が既に検討済みであることを踏まえること**。
- **Zustand + TanStack Queryの併用**: ZustandだけではRTK Queryのようなサーバー状態
  キャッシュの仕組みが無いため、意図的に2ライブラリを併用している（役割分担は
  [state-management.md](state-management.md)参照）。片方に寄せる変更（例: サーバーデータを
  Zustandに持たせる）は設計方針に反するため避けること。
- **`injectManifest`戦略を採用（`generateSW`ではない）**: `push`/`notificationclick`/
  `pushsubscriptionchange`の独自イベントハンドリングが必要なため。PWA設定を変更する際に
  `generateSW`に戻すとこれらのカスタムハンドラが失われる点に注意。
- **Push送信をQueueで非同期化**: 投稿APIのレスポンス自体のCPU時間・サブリクエスト数を
  圧迫しないための設計。投稿API内でPush送信を同期的に行う変更は無料プランの制限に抵触する
  リスクがあるため避けること。
- **1人1メッセージのenqueue方式**: 1メッセージの送信失敗が他メンバーへの通知に影響しない
  設計。バッチ処理の効率化のためにこれをまとめる変更をする場合は、この独立性が失われない
  設計にすること。
- **API呼び出しは`fetch`ではなくaxiosを採用**: フロントの`src/react-app/lib/api.ts`は
  素の`fetch`ラッパーから`axios.create({ withCredentials: true, timeout: ... })`の
  `instance`を使う実装に変更済み（学習目的での採用要望）。検討したメリット・デメリットは
  以下の通り。
  - メリット: リクエスト/レスポンスインターセプターで「非2xxレスポンスを`ApiError`に変換
    する」処理と「ボディがある場合のみ`Content-Type: application/json`を付与する」処理を
    一箇所に集約できる、`timeout`オプションで簡単にタイムアウトを設定できる、レスポンスの
    JSON自動パース（`fetch`の`response.json()`手動呼び出しが不要）、`AxiosError`という
    型付きエラーでネットワークエラー/タイムアウトとHTTPエラーを判別しやすい。
  - デメリット: バンドルサイズが増える（フロント向けの依存であり、Workers側のCPU時間制限
    には影響しない）、このプロジェクトの要件（同一オリジンAPI・Cookie認証・JSON専用）は
    `fetch`だけでも十分満たせるため過剰実装になり得る、依存が1つ増える。
  - 判断: 大きなデメリットが無く、学習目的での採用要望があったため採用した。
    `apiGet`/`apiPost`/`apiPatch`/`apiDelete`という呼び出し側のインターフェース（関数シグネチャ）は
    変更していないため、`src/react-app/queries/*.ts`側のコードは無変更で動作する。
    既存の`ApiError`クラス（`status`・`body`を保持）もそのまま維持し、axiosのレスポンス
    インターセプターで`AxiosError`（またはレスポンスが無いネットワークエラー/タイムアウト、
    その場合は`status: 0`）を`ApiError`に変換してthrowする実装にしたため、
    `useAuth.ts`の`error instanceof ApiError && error.status === 401`や
    `LoginPage.tsx`の`error instanceof ApiError`によるエラーメッセージ抽出は無変更で動作する。
    新しいAPIクライアントコードを追加する際も、`src/react-app/lib/api.ts`の
    `apiGet`/`apiPost`/`apiPatch`/`apiDelete`経由でaxios instanceを使うこと（Worker側の実装は
    `fetch`/Web標準APIのままで変更なし。axios導入はフロントのみに限定した変更）。
- **`react-router`を採用（ルーティングライブラリ未導入という過去の判断を更新）**: 画面が
  ログイン画面とメイン画面の2つのみだった時点では「ルーティングライブラリは過剰」と判断し
  未導入だったが、学習目的での採用要望を受けて再検討し、v7系パッケージ（`react-router-dom`
  ではなく統合パッケージ名の`react-router`、`createBrowserRouter`+`RouterProvider`による
  data router API）を採用した。検討したメリット・デメリットは以下の通り。
  - メリット: URLと画面状態が対応する（ブラウザの戻る/進む、リロード、直接アクセス、
    ブックマークが機能する）、404ページなど今後の画面追加に対応しやすい宣言的なルート構造
    になる、`react-router`はReactエコシステムの定番ライブラリで学習効果が高い。
  - デメリット: 画面数が少ない現状では過剰設計になり得る、依存が1つ増える（バンドルサイズ
    増加）、SPAをCloudflare Workers Static Assetsで配信する構成でクライアントサイド
    ルーティング（パスベースの直接アクセス・リロード）が機能するか確認が必要だった。
  - SPA配信の確認結果: `wrangler.jsonc`の`assets.not_found_handling: "single-page-application"`
    により、`Sec-Fetch-Mode: navigate`ヘッダ付きのナビゲーションリクエスト
    （実ブラウザでの直接アクセス・リロード・戻る/進む）は静的アセットに一致しない限り
    `index.html`にフォールバックされる。このフォールバックはWorker本体（`src/worker/index.ts`
    のHono app）を経由せず、Cloudflareのアセット配信層で行われるため
    （`run_worker_first`未設定＝デフォルトのasset-first routing）、本番デプロイはもちろん
    `@cloudflare/vite-plugin`を使う`pnpm dev`のローカル開発サーバーでも同様に動作することを
    ヘッドレスブラウザでの実機確認で検証済み（`curl`単体では`Sec-Fetch-Mode: navigate`
    ヘッダが付与されないため、Workerの通常の404レスポンスが返る点に注意。動作確認には
    実ブラウザ、または当該ヘッダを明示的に付与したリクエストが必要）。
  - 判断: 大きなデメリットが無く、学習目的での採用要望があったため採用した。ルート構成・
    認証ガードの実装方針は[state-management.md](state-management.md)を参照。
  - 対象外にしたこと: `GroupSwitcher`が管理する選択中グループ（Zustandの
    `selectedGroupId`）をURLクエリ等に同期させる変更は今回のスコープ外とし、既存の
    Zustand管理をそのまま維持した（グループ選択をURL共有可能にする場合は別途検討）。
- **Atomic Design（5階層のUIコンポーネント分類）は見送り、`components/ui/`への部分的な
  切り出しのみ採用**: 学習目的での採用要望があったため、フル採用(atoms/molecules/
  organisms/templates/pages)・見送り・部分的採用(ハイブリッド)の3択で真剣に検討した。
  - **検討したメリット**: UIの再利用性・一貫性が上がる可能性、コンポーネントの複雑度に
    応じた明確な階層、デザインシステムとしての学習効果。
  - **検討したデメリット（フル採用を見送った理由）**:
    - (a) コンポーネント数が全体で10個程度（`Layout`, `LoadingScreen`, `LoginPage`,
      `GroupSwitcher`, `NotificationOptIn`, `PostRecordModal`, `RecordsList`
      (+内部の`RecordCard`), `HomePage`, `NotFoundPage`）と少なく、5階層への分類自体が
      過剰設計になりやすい（他の設計判断と同じく「規模に見合った選択をする」方針に反する）。
    - (b) 「このコンポーネントはmoleculeかorganismか」という分類の恣意性が発生しやすい。
      例えば`GroupSwitcher`（データ取得+Zustand更新+条件分岐する`<select>`）や
      `NotificationOptIn`（Web Push API呼び出し+複数の状態分岐を持つボタン）は、
      見た目だけならmolecule相当だが実態はビジネスロジックを大量に抱えており、
      明確な基準を作るのが難しい。
    - (c) このリポジトリは`features/{auth,groups,records,push}`というドメイン単位の構成を
      既に取っているが、Atomic Designは「UIの見た目の複雑さ」で分類するため、
      `GroupSwitcher`（groupsドメイン）と`RecordsList`（recordsドメイン）が両方
      organism相当になり得るなど、ドメインの一貫性を分断する。例えば「recordsドメインの
      機能を削除する」場合、`features/records/`ディレクトリを消すだけでは済まなくなり、
      `organisms/`・`molecules/`等複数階層をまたいで関連ファイルを探す必要が生まれる。
    - (d) [state-management.md](state-management.md)のTanStack Query/Zustandによる
      サーバー状態・クライアント状態の管理方針とAtomic Designの階層は直交する概念であり、
      うまく組み合わせないと「organismにビジネスロジックが漏れる」問題が起きやすい。
      実際、上記(b)で挙げた`GroupSwitcher`/`NotificationOptIn`/`PostRecordModal`は
      いずれもクエリフック呼び出し・フォーム状態・副作用を内包しており、見た目の階層と
      ロジックの所在が一致しない。
    - (e) `react-router`導入で新設された`routes/`配下のページ相当コンポーネント
      （`routes/HomePage.tsx`等）と、Atomic Designの`pages`層が意味的に重複・競合する。
      `routes/`は「ルーティング（URL⇔画面の対応、認証ガード）」の関心事、Atomic Designの
      `pages`は「テンプレートにデータを注入したもの」という別の関心事であり、無理に統合すると
      ルート定義（`routes/router.tsx`）とpage実装の置き場所がねじれる。
  - **判断**: フル採用(A)は上記(a)〜(e)のデメリットが小規模な本リポジトリでは明確に上回ると
    判断し見送った。一方、実装を精査した結果、`LoginPage.tsx`と`PostRecordModal.tsx`の
    ラベル付きinput（6箇所）・フォームエラー表示（2箇所）は完全に同一のTailwindクラスの
    重複が**実在**していた。`LoginPage`/`PostRecordModal`/`Layout`/`RecordsList`のボタン
    （6箇所）も、角丸・font-medium・transition等の共通の構造パターンを持ち（一部は完全一致）、
    ドメインロジックを一切含まない見た目のみの重複だった。これを放置する見送り(B)は改善余地を
    残すため、ドメインに依存しない汎用UI部品だけを`components/ui/`に切り出す
    部分的採用(C)を採用した。
    - `components/ui/Button.tsx`: `variant`（`primary`/`secondary`/`ghost`）で色・
      ホバー・disabled時の見た目のみを共通化し、padding/text-size等のサイズは呼び出し側が
      `className`で上書きする設計。`LoginPage`の送信ボタン、`PostRecordModal`の
      送信/キャンセルボタン、`Layout`のヘッダー内「＋記録を追加」/ログアウトボタン、
      `RecordsList`の「もっと見る」ボタンに適用。
    - `components/ui/FormField.tsx`: `TextField`（label+input）と`TextAreaField`
      （label+textarea）をexport。`LoginPage`のメール/パスワード欄、`PostRecordModal`の
      勉強日時/タイトル/メモ欄に適用。value/onChange等の状態管理は引き続き
      呼び出し側（`features/`配下）が持ち、ここでは見た目のみを共通化することで
      デメリット(d)（organismへのロジック漏れ）を回避している。
    - `components/ui/ErrorMessage.tsx`: フォームエラー表示のボックスを共通化。
      `LoginPage`・`PostRecordModal`のエラー表示に適用。
    - **意図的に対象外にしたもの**: `Layout.tsx`のモバイル用フローティングアクションボタン
      （円形・固定位置という一点物のスタイル）と`NotificationOptIn.tsx`の購読状態に応じた
      2色切り替えボタンは、`Button`の`variant`に追加するとそのvariantが他で一切使われない
      ため、無理な抽象化になると判断しあえて個別実装のまま維持した。「カード」の切り出しも
      検討したが、`LoginPage`のカード風コンテナと`RecordCard`はpadding・borderの有無が
      異なり実質的な重複が薄いため見送った。
    - **命名/配置**: `atoms`/`molecules`のような抽象的な階層名ではなく、既存の
      `components/{Layout,LoadingScreen}.tsx`と同じ`components/`配下に`ui/`
      サブディレクトリを切っただけに留めている。これにより「ドメインに依存しない
      横断的なUI」という役割は`components/`全体で表現されたまま、その中でも
      「本当に汎用的な部品」であることが`ui/`のディレクトリ名から分かるようにした
      （`atoms`/`molecules`という命名は本リポジトリの規模では情報量に見合わないと判断）。
    - 新しいドメイン固有コンポーネントに汎用input/button/エラー表示が必要になった場合は、
      まず`components/ui/`の既存部品を使えないか確認すること。逆に、ドメインロジックを
      持つコンポーネント（データ取得・Zustand参照・副作用等）は今まで通り`features/`配下に
      置き、`components/ui/`には追加しないこと（デメリット(b)(d)の再発防止）。
