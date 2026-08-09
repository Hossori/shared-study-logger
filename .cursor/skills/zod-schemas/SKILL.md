---
name: zod-schemas
description: >-
  shared/schemas.ts の Zod v4 スキーマを編集・追加する際に使用する。
  フォーマット検証（email, url, datetime 等）の書き方と変更後の検証手順。
---

# Zod スキーマ規約

`shared/schemas.ts` を変更するときだけ読めば十分。

## ルール

Zod v4 では `z.string().<format>()` は非推奨。トップレベル関数を使う。

| 非推奨 | 代替 |
| --- | --- |
| `z.string().email()` | `z.email()` |
| `z.string().url()` | `z.url()` |
| `z.string().datetime()` | `z.iso.datetime()` |

日時フィールドはフロントから `toISOString()` で送る想定。

## 変更後

```bash
pnpm run check:zod-deprecated
pnpm exec tsc -b
```

`tsc -b` と ESLint は `@deprecated` を検出しない。

## 関連

- 検査スクリプト: `scripts/check-zod-deprecated.mjs`
- その他の品質チェック: [shared-study-logger-overview/reference/code-quality.md](../shared-study-logger-overview/reference/code-quality.md) §2
