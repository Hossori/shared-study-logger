---
name: development-manual
description: >-
  作業の分割、ブランチ作成、コミット前ゲート、GitHub の PR 分担、
  work-planner / implementer / reviewer への Task 委譲。
  コード変更、機能追加、バグ修正、ブランチ操作、PR 作成、サブエージェント起動のときに使用する。
---

# 作業分割とサブエージェント委譲

ブランチ規約と入口は [AGENTS.md](/AGENTS.md)。コミット前ゲートのコマンドは [docs/testing.md](/docs/testing.md)。

## 作業の進め方

- 作業は独立して実装・レビューできる単位に分割し、可能なら並行する。
- 各単位に `develop` から切ったブランチを一つ用意する。
- 分割した場合、親は分割方針・受け入れ条件・範囲外を渡し、進捗とレビューを統合して完了判定する。

コード変更では、完了報告・コミットの前に [docs/testing.md](/docs/testing.md) のゲートを実行する。ドキュメントのみなどコードに影響しない変更では省略可。判断に迷う場合は実行する。

## この環境での委譲（Cursor）

役割プロンプトは `.cursor/agents/` の `work-planner` / `implementer` / `reviewer`。

各作業単位に次を割り当てる。

1. **work-planner**（`model: inherit`）: 調査と計画。内容を明確にしてから **implementer** へ委譲する。大きな差分は自分で書かない。
2. **implementer**（`composer-2.5[fast=true]`）: work-planner、または計画済みの親だけが起動する。Task の `model` に **`composer-2.5-fast`** を渡す。
3. **reviewer**（`model: inherit`、`readonly`）: 完了後に独立検証し、問題があれば指摘する。修正はしない。

小さく単一で完結する作業でも、可能な限り work-planner と reviewer を分ける。その他のサブエージェントのモデルは `cursor-grok-*` または `composer-*`。

役割ごとのゲート:

- **implementer**: ゲートを実行し、警告・エラーを解消してから返す。UI / 画面契約に触れる変更では `pnpm test:e2e` も必須。
- **work-planner**: ゲート結果を受け入れ条件と照合する。不足なら implementer を resume する。
- **reviewer**: 独立に全量またはスポットで確認する。readonly でコマンドが書けない場合は親へ実行を依頼する。未解消の失敗は差し戻す。

## GitHub 操作

`push` / `commit` など git ローカル操作は `shell` や implementer でよい。**GitHub 書き込み（PR 作成・更新など）は親が行う**。Cloud Agent では親の PR ツール、ローカル Cursor では GitHub 連携。サブエージェントは `git push` まで担当し、PR 用パラメータを親へ返す。
