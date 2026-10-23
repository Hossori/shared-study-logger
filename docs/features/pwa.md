# PWA

ホーム画面追加、静的アセットのプリキャッシュ、Push 受信。テーマとオーバーレイの採用理由は [design-decisions.md](../design-decisions.md)。API 版の拒否仕様は [api.md](../api.md)。

## 不変条件

- `vite-plugin-pwa` は `injectManifest`（`public/sw.ts`）
- `manifest.webmanifest` は `display: "standalone"`（iOS Push の前提）
- オフライン編集は対象外。プリキャッシュは最小構成
- API 非互換時は `shared/client-api-version.ts` の `CLIENT_API_VERSION` と `MIN_SUPPORTED_CLIENT_API_VERSION` を揃え、Worker が 426 `client_update_required` でハンドラ前に拒否する。ブリッジリリースだけ最小版を `null`

## ビルドと更新

`injectRegister: false`。登録は `src/react-app/main.tsx`。本番は `/sw.js`。`pnpm build` で `self.__WB_MANIFEST` を注入した `dist/client/sw.js` が登録対象。

待機中 SW を検出したら更新依頼を出す。利用者が「更新する」を選ぶと、待機中 Worker があれば `SKIP_WAITING` で有効化し、`controllerchange` で再読み込みする。待機中 Worker が無い場合は `registration.update()` で新 SW の `installed` を待ってから同様に有効化する。有効化後に `controllerchange` が来ない、または更新確認・待機が失敗した場合だけフォールバックとして再読み込みする。

移行マーカーの無い旧 PWA（既存の active Worker あり）は初回 install で `skipWaiting` し、activate でウィンドウを再読み込みしてマーカーを保存する。新規インストール（active Worker なし）では install 時にマーカーのみ保存し、強制リロードは行わない。

セーフエリアは `viewport-fit=cover` と `env(safe-area-inset-*)`。実装の入口は `src/react-app/app/shell/Layout.tsx`。

## 変更するとき

アイコンやマニフェストを変えたら `vite.config.ts` の `injectManifest.globPatterns` を確認する。手動確認は [manual-checklist.md](../manual-checklist.md)。

## 入口

- `vite.config.ts`
- `public/sw.ts`
- `public/manifest.webmanifest`
- `src/react-app/main.tsx`
- `shared/client-api-version.ts`
- `shared/sw-lifecycle.ts`
