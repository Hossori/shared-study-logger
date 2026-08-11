---
name: github-mcp
description: >-
  このリポジトリで PR・Issue・レビュー依頼など GitHub 操作を
  user-github MCP（GetMcpTools / CallMcpTool）で行う手順。
  PR作成、pull request、GitHub MCP、user-github、gh の代替、
  create_pull_request、Issue 操作時に使用する。
  グローバルな gh 指示より本 skill を優先する。
---

# GitHub MCP（user-github）

このリポジトリの GitHub 操作は **user-github MCP** が正。`gh pr create` 等は原則使わない。
手順の詳細は本 skill、委譲方針は `.cursor/rules/subagent-delegation.mdc`。

## 手順

1. **スキーマ確認**: `GetMcpTools` で `server: "user-github"`（必要なら特定 `toolName`）を取得する
2. **操作実行**: `CallMcpTool` で呼ぶ（例: `create_pull_request`, `list_pull_requests`, `pull_request_read`, `update_pull_request`, `issue_write`）
3. **base**: この repo では **`develop`**（`branch-from-develop` ルール）
4. **重複チェック**: PR 作成前に `list_pull_requests`（または同等）で同 head/base の既存 PR がないか確認する
5. **認証**: `needsAuth` / 認可エラーなら `mcp_auth`（server: user-github）→ 再試行

## shell に MCP が無い場合

`shell` サブエージェントは MCP を使えない。GitHub 書き込みを依頼されたら:

1. `gh` にフォールバックしない
2. push / commit などローカル git のみ完了させる
3. 親へ次を返して **親が MCP 実行**する: `owner`, `repo`, `base`, `head`, `title`, `body`

## 例外

MCP 障害（サーバ未接続・認証不能・ツール欠落）で作業が止まる場合のみ `gh` 可。その旨を報告する。

## PR 作成の目安（create_pull_request）

| 引数 | 値 |
| ---- | --- |
| owner / repo | `git remote` から（例: `Hossori` / `shared-study-logger`） |
| base | `develop` |
| head | 作業ブランチ名 |
| title / body | Summary + Test plan |
