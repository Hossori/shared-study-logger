# コード品質

`tsc`・ESLint・テストの実行条件は [testing.md](testing.md) のコミット前ゲート。Zod のフォーマット API は [zod-schemas](../.agents/skills/zod-schemas/SKILL.md)。

ここには、自動チェックだけでは判断しにくいエディタ警告と実装上の判断を書く。

## TypeScript の project reference

新しいエントリーポイントやテストを追加したら、既存の `tsconfig.*.json` の `include` に含まれることを確認する。

- 対象の実行環境と設定が合う既存プロジェクトがあれば、それを使う
- DOM・Worker・Node など既存と異なる型環境が必要なら、専用 tsconfig を作り、ルート `tsconfig.json` の `references` に追加する
- どのプロジェクトにも属さないファイルは `tsc -b` の対象外になり、エディタの推論プロジェクトと実行環境で型がずれることがある

追加後は対象ファイルのエディタ警告と `pnpm run typecheck` の両方を確認する。

## 非推奨 API

エディタの `@deprecated` 表示は代替 API に置き換える。

UTF-8 のバイト変換は `TextEncoder` / `TextDecoder` を使う。

## Tailwind の可読性

固定長さは、まず Tailwind の標準スケールで表現する。値が一致しない、ビューポート相対単位が必要、または意図を明確にできる場合はアービトラリバリューを使ってよい。

- 条件付きクラスは `src/react-app/lib/utils.ts` の `cn`
- 静的なクラスを定数へ切り出すのは、名前で意図が読みやすくなる場合だけ
- クラス順は Prettier に任せる。整形はコミット前ゲート
