# エディタ警告・コード品質チェックリスト

[← SKILL.md](../SKILL.md)

エディタ(Cursor/VSCode)上にだけ出る警告や、`tsc -b`・ESLintでは検出されないが放置すべきでない問題への対応。
同種の問題に遭遇したらまずここを確認する。ZodのフォーマットAPI規約は本ファイルではなく[zod-schemas](../../zod-schemas/SKILL.md)が正本。

## 1. tsconfigのproject referenceカバレッジ

ルートの`tsconfig.json`が次を`references`で束ねる:

- `tsconfig.app.json` … `src/react-app` + `shared`
- `tsconfig.node.json` … `vite.config.ts` / `vitest*.config.ts` / `playwright.config.ts`
- `tsconfig.worker.json` … `src/worker` + `shared`
- `tsconfig.sw.json` … `public/sw.ts`
- `tsconfig.unit.json` … `tests/unit`（DOM。`worker-configuration.d.ts` + `src/worker/types/env.d.ts` で Env を補完）
- `tsconfig.tests.worker.json` … `tests/worker`（`tsconfig.worker.json` を拡張 + `@cloudflare/vitest-pool-workers/types`）

**新しいディレクトリ・エントリーポイント（`public/`の新規スクリプト、`scripts/`のNode用、`tests/` 等）を追加したら、必ずいずれかの`include`に含まれるか確認すること。**

- どのtsconfigにも属さないファイルは`tsc -b`の対象外になる一方、エディタは推論プロジェクト（DOM込みの既定lib）で型チェックする。`/// <reference lib="webworker" />`等があると`self`/`Notification`等の型が衝突し、的外れなエラーが続く。
- **実例（`public/sw.ts`）**: 未所属だったため誤検出が発生 → `lib: ["ES2020", "WebWorker"]`（DOMなし）の`tsconfig.sw.json`を新設し、ルートの`references`に追加して解決。
- **実例（`tests/`）**: 未所属だと CI の `typecheck` をすり抜ける。unit は DOM、worker テストは Workers 型が必要なので専用 tsconfig を分け、`pnpm run typecheck` / `typecheck:tests` でゲートする。
- `pnpm exec tsc -b`が通っても「全ファイルが型チェック済み」とは限らない。`references`配下の`include`以外は静かにスキップされる。
- **対処手順**:
  1. 既存の`tsconfig.*.json`の`include`に入るか確認（入るなら追加対応不要）。
  2. 入らず、かつ既存と異なる実行環境（`lib`/`target`）が必要なら専用tsconfigを新設し`references`に追加。
  3. 対象ファイルをエディタで開き直し、無関係な型エラーが消えることを確認。

## 2. 非推奨(deprecated) API

非推奨のグローバル関数・メソッドは新規コードに持ち込まない。

- `escape()`/`unescape()`は使わない。UTF-8セーフなBase64は`TextEncoder`/`TextDecoder`を使う（実装例: `src/worker/lib/db.ts`の`encodeCursor`/`decodeCursor`）。`btoa(unescape(encodeURIComponent(...)))`パターンも禁止。
- Zodの文字列フォーマット系API（`.email()`/`.url()`等）→ [zod-schemas skill](../../zod-schemas/SKILL.md)を正とする。検査は`pnpm run check:zod-deprecated`（手動で長いgrepリストをメンテしない）。
- **心構え**: エディタの打消し線（TypeScriptが`@deprecated`を検出）は無視せず、代替APIへ置き換える。
- **簡易チェック**:

```bash
grep -rn -E 'escape\(|unescape\(|\.substr\(|componentWillMount|findDOMNode' src
pnpm run check:zod-deprecated
```

## 3. Tailwindのアービトラリバリュー方針

固定長さ（rem/px）は、まずTailwind既定スペーシングスケール（v4では`--spacing: 0.25rem`基準）で表現できないか確認し、一致すれば標準クラス（`max-w-32`, `w-40`等）を使う。`max-w-[8rem]`のような`[]`表記は最終手段。

- **対象外**: `vh`/`vw`/`dvh`等のビューポート相対単位（例: `max-h-[90vh]`）。
- 既定スケールに一致しない場合は`@theme`でのカスタムトークン化を検討するか、意図コメントを添えてアービトラリを使う。
- **検出**（ヒットを`0.25rem`で割って整数なら標準クラス化を検討）:

```bash
grep -rnE '\[[0-9.]+(rem|px)\]' src
```

## 4. 長いTailwindクラス名の可読性

1要素に多数のユーティリティを1行の`className`にすると見通しが悪い。次の3手法を使い分ける。

| 状況 | 手法 |
| --- | --- |
| 静的で長いクラス（目安7個以上、またはレイアウト/色/状態等が混在） | モジュールレベル定数に分割し意味のある名前を付ける |
| 条件分岐でクラスを組み立てる | `cn()`（`src/react-app/lib/cn.ts`、clsxベース） |
| 短い（5〜6個以下）かつ単一の関心事 | インラインのまま（過剰抽象化を避ける） |

- **定数化の置き場所**: `props`/`state`に依存しない静的文字列は、関数内ローカルではなくモジュールレベル`const xxxClassName`にする（再レンダーごとの再生成を避ける。先例: `FormField.tsx`の`fieldLabelClassName`等）。
- `cn`はclsxのみ。`tailwind-merge`は未導入（variant側と呼び出し側でユーティリティグループが重ならない設計のため）。導入を検討する場合は重複解決が本当に必要か先に確認する。
- cva等のvariantライブラリは現状の規模（例: `Button`のvariantが少ない）では不要。「規模に見合った選択」は[design-decisions.md](design-decisions.md)（Atomic Design 項）と同方針。
- クラス並び順は`prettier-plugin-tailwindcss`で統一（`.prettierrc.json`）。対象は`src/react-app`と`shared`（`src/worker`は対象外）。並び替えだけでは生成CSSの内容は変わらない。

```bash
pnpm run format:check   # 確認のみ（CI Quality でも実行）
pnpm run format         # 整形して上書き
```

### Prettier ゲートとコミット前整形

- CI（`.github/workflows/ci.yml` の Quality）で `pnpm run format:check` が必須。ローカルでも PR 前に同じコマンドを通す。
- `simple-git-hooks` + `lint-staged` の pre-commit が、staged な `src/react-app/**/*.{ts,tsx}` / `shared/**/*.ts` にだけ `prettier --write` する（フル `format` は走らせない）。
- 初回 clone 後は `pnpm install`（`prepare` → `simple-git-hooks`）で hook が `.git/hooks` に入る。hook をスキップ（`--no-verify`）すると CI で再び落ちうる。
- エディタは `.vscode/settings.json` の format on save + ワークスペース Prettier（`prettier.prettierPath`）を使う。推奨拡張は `.vscode/extensions.json`。
- 改行は `.gitattributes` で LF 固定（`*.{cmd,bat,ps1}` のみ CRLF）。Windows の `core.autocrlf` だけでは `format:check` がローカルだけ落ちることがある。

## まとめ: PRレビュー時のチェックリスト

PR前に次を確認する（ZodのAPI表はここに複製しない）。

- [ ] 新しいディレクトリ・エントリーポイントがいずれかのtsconfigの`include`に含まれるか（属さない場合は専用tsconfigを新設し`references`に追加）
- [ ] `escape`/`unescape`等の非推奨APIや、エディタで打消し線が付いたAPIを使っていないか
- [ ] Zodスキーマ変更時は[zod-schemas](../../zod-schemas/SKILL.md)に従い、`pnpm run check:zod-deprecated`を実行したか
- [ ] `rem`/`px`のアービトラリバリューが既定スペーシングの数値クラスで置き換えられないか（`vh`/`vw`/`dvh`は対象外）
- [ ] 長い静的`className`はモジュール定数へ、条件分岐は`cn()`へ。`pnpm run format:check`でクラス順序も確認（コミット前は pre-commit の lint-staged でも整形）
