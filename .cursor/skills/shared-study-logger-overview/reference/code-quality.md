# エディタ警告・実装時の品質指針

[← SKILL.md](../SKILL.md)

`tsc`・ESLint・テストの実行条件は [testing-strategy](../../testing-strategy/SKILL.md) の「コミット前ゲート」を正本とする。
ここには、その自動チェックだけでは判断しにくいエディタ警告と実装上の判断だけを記載する。Zod のフォーマット API は [zod-schemas](../../zod-schemas/SKILL.md) を参照。

## TypeScript の project reference

新しいエントリーポイントやテストを追加したら、既存の `tsconfig.*.json` の `include` に含まれることを確認する。

- 対象の実行環境と設定が合う既存プロジェクトに含められるなら、それを使う。
- DOM・Worker・Node など既存と異なる型環境が必要なら、専用 tsconfig を作成し、ルート `tsconfig.json` の `references` に追加する。
- どのプロジェクトにも属さないファイルは `tsc -b` の対象外になる。エディタで推論プロジェクトとして開かれ、実行環境と異なる型エラーが出ることもある。

追加後は対象ファイルのエディタ警告と `pnpm run typecheck` の両方を確認する。

## 非推奨 API

エディタの `@deprecated` 表示は無視せず、代替 API を確認して置き換える。

- `escape()` / `unescape()` と、それらを組み合わせた Base64 変換は使わない。UTF-8 を扱う場合は `TextEncoder` / `TextDecoder` を使う。
- Zod の文字列フォーマット API は zod-schemas の規約に従う。検証コマンドはコミット前ゲートに含まれる。

## Tailwind の可読性

固定長さは、まず Tailwind の標準スケールで表現する。値が一致しない、ビューポート相対単位が必要、または意図を明確にできる場合はアービトラリバリューを使ってよい。

- 条件付きクラスは `src/react-app/lib/cn.ts` を使う。
- 静的なクラスを定数へ切り出すのは、名前を付けることで意図が読みやすくなる場合だけにする。短い `className` まで抽象化しない。
- クラス順は Prettier に任せる。整形を含む検証はコミット前ゲートに従う。
