# PWA対応

[← SKILL.md](../SKILL.md)

- **概要**: ホーム画面への追加（インストール可能）、Service Workerによる静的アセットの
  プリキャッシュ、Push通知受信をサポート。
- **関連ファイル**: `vite.config.ts`（`VitePWA`設定）、`public/sw.ts`（カスタムService Worker
  ソース）、`public/manifest.webmanifest`、`public/icons/`、`index.html`
  （`<link rel="manifest">`等）、`src/react-app/main.tsx`（SWの手動登録）
- **データフロー/ビルド**: `vite-plugin-pwa`を**`injectManifest`戦略**で使用
  （`generateSW`の自動生成では`push`/`notificationclick`の独自ハンドリングを追加できないため）。
  `srcDir: "public"`, `filename: "sw.ts"`, `manifest: false`（マニフェストは静的ファイルとして
  自前管理）, `injectRegister: false`（登録はmain.tsxで手動）。開発時は`devOptions.enabled`
  により`/dev-sw.js?dev-sw`を登録し、本番は`/sw.js`を登録する。`pnpm build`時に
  `public/sw.ts`がコンパイルされ、Workboxの`precacheAndRoute(self.__WB_MANIFEST)`で
  プリキャッシュ対象が注入された`dist/client/sw.js`が生成される（`sw.mjs`も出力されるが
  実際に登録されるのは`sw.js`）。
- **注意点**: `manifest.webmanifest`は`display: "standalone"`必須（iOSでPush通知を有効にする
  前提条件）。認証必須のデータアプリのため完全なオフライン編集は対象外（最小構成のキャッシュ
  のみ）。アイコンやマニフェストの内容を変更した場合、`vite.config.ts`の
  `injectManifest.globPatterns`に含まれているか確認すること。
- **セーフエリア**: `index.html` の viewport は `viewport-fit=cover`。iPhone の角丸・
  Dynamic Island・横画面では `env(safe-area-inset-*)` を Layout / Dialog / AlertDialog /
  ログイン画面で使い、通常の padding と inset の大きい方を取る。
