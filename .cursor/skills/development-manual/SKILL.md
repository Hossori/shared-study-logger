---
name: development-manual
description: 作業の分割、ブランチ作成、コミット前ゲート、GitHub 操作 について。コード変更、機能追加、バグ修正、ブランチ、PR、Task / サブエージェント委譲のときに使用する。
---

# 作業分割とサブエージェント委譲

役割プロンプトは `.cursor/agents/` の `work-planner` / `implementer` / `reviewer` に置く。モデルと PR 先の常時ポリシーは [AGENTS.md](/AGENTS.md)。ゲートのコマンド正は [testing-strategy](../testing-strategy/SKILL.md) の「コミット前ゲート」。

## ブランチ

```bash
# ✅ GOOD
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feature/notification-opt-in

# ❌ BAD
git checkout -b feature/foo       # develop 以外から切っている可能性
git checkout -b feat/foo          # プレフィックス不一致
git checkout -b fix-login-bug     # プレフィックス欠落
```

## 委譲

- 作業は適切な単位に分割し、可能であれば並行する。分割の目安: 独立して実装・レビューできるまとまり（機能単位、関心の分離、衝突しにくい範囲）。
- 各作業単位に develop から切ったブランチを一つ用意し、次を割り当てる。
  1. **work-planner**（`model: inherit`）: 調査と計画。内容を明確にしてから **implementer** へ委譲する。大きな差分は自分で書かない。
  2. **reviewer**（`model: inherit`、`readonly`）: 完了後に独立検証し、問題があれば指摘する。修正はしない。
- **implementer**（`composer-2.5[fast=true]`）は work-planner、または計画済みの親だけが起動する。Task の `model` に **`composer-2.5-fast`** を必ず渡す。
- ブランチのプレフィックス: 機能 `feature/`、環境・設定 `chore/`、不具合 `fix/`。これはクラウド指示に優先する。
- 小さく単一で完結する作業でも、可能な限り work-planner と reviewer を分ける。
- その他でサブエージェントを利用する場合、モデルは `cursor-grok-*` あるいは `composer-*` のいずれかとする。

分割して委譲した場合、自身は管理者として次を行う。

- 分割方針と各単位の受け入れ条件を定義する
- サブエージェントへ明確な指示を渡す（ブランチ名、受け入れ条件、範囲外）
- 進捗・依存関係・レビュー結果を統合する
- 最終的な品質判断と完了判定を行う

## 完了前の静的チェック / テスト（必須）

コード変更では、完了報告・コミットの前にローカルで検証する。詳細は [testing-strategy](../testing-strategy/SKILL.md) の「コミット前ゲート」。

- **implementer**: ゲートを実行し、警告・エラーを解消してから返す。UI / 画面契約に触れる変更では `pnpm test:e2e` も必須。
- **work-planner**: ゲート結果を受け入れ条件と照合する。不足なら implementer を resume する。
- **reviewer**: 独立に全量またはスポットで確認する。readonly でコマンドが書けない場合は親へ実行を依頼する。未解消の失敗は差し戻す。
- ドキュメントのみなどコードに影響しない変更では省略可。判断に迷う場合は実行する。

## GitHub 操作

`push` / `commit` など git ローカル操作は `shell` や implementer でよいが、**GitHub 書き込み（PR 作成など）は親が MCP で行う**。

```text
# ✅ GOOD
親が user-github MCP で create_pull_request
implementer / shell は git push まで担当し、PR 用パラメータを親へ返す

# ❌ BAD
shell に「gh pr create」や「MCP で PR 作成」を丸投げする
implementer が PR を作成する
```
