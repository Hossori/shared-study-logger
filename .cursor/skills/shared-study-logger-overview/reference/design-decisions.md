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
    `apiGet`/`apiPost`/`apiDelete`という呼び出し側のインターフェース（関数シグネチャ）は
    変更していないため、`src/react-app/queries/*.ts`側のコードは無変更で動作する。
    既存の`ApiError`クラス（`status`・`body`を保持）もそのまま維持し、axiosのレスポンス
    インターセプターで`AxiosError`（またはレスポンスが無いネットワークエラー/タイムアウト、
    その場合は`status: 0`）を`ApiError`に変換してthrowする実装にしたため、
    `useAuth.ts`の`error instanceof ApiError && error.status === 401`や
    `LoginPage.tsx`の`error instanceof ApiError`によるエラーメッセージ抽出は無変更で動作する。
    新しいAPIクライアントコードを追加する際も、`src/react-app/lib/api.ts`の
    `apiGet`/`apiPost`/`apiDelete`経由でaxios instanceを使うこと（Worker側の実装は
    `fetch`/Web標準APIのままで変更なし。axios導入はフロントのみに限定した変更）。
