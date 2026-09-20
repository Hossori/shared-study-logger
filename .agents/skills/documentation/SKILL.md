---
name: documentation
description: >-
  リポジトリのドキュメントと skill の正本・粒度・書き方。
  docs、AGENTS.md、README、SKILL.md の追加・整理、正本の置き場、重複削除のときに使用する。
paths: docs/**/*.md,AGENTS.md,README.md,.agents/skills/**/SKILL.md
---

# ドキュメント整備

## 正本

| 内容                                  | 置き場                                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 人間向け操作（install、seed、deploy） | [README.md](/README.md)                                                                                     |
| 地図と機能索引                        | [docs/architecture.md](/docs/architecture.md)                                                               |
| API / データモデル / テスト           | [docs/api.md](/docs/api.md)、[docs/data-model.md](/docs/data-model.md)、[docs/testing.md](/docs/testing.md) |
| 機能の契約                            | [docs/features/](/docs/features/)                                                                           |
| 設計判断・コード品質                  | [docs/design-decisions.md](/docs/design-decisions.md)、[docs/code-quality.md](/docs/code-quality.md)        |
| 作業分割と委譲、Zod フォーマット      | `.agents/skills/` の各 skill                                                                                |
| 常時のブランチ規約と docs 索引        | [AGENTS.md](/AGENTS.md)                                                                                     |

## 書き方

- 主文は従うべきこと。禁止は、エージェントの既定動作が誤りになるとき、破壊的操作、旧 API の検索キーに限る
- 同じ事実は1箇所。他はリンクを用いる。
- 機能 docs は 不変条件 → 必要な流れ → 変更するとき → 入口

## Cursor 専用の記載

- `.cursor/agents/` の役割定義
- development-manual の委譲節（Task の model、Cloud とローカルの PR 分担）
- `e2e/README.md` のエージェント環境におけるブラウザパス

`.agents/skills/shadcn` はベンダーのため編集しない。
