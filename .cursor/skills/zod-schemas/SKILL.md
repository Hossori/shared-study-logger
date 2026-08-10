---
name: zod-schemas
description: >-
  shared/schemas.ts の Zod v4 スキーマ追加・変更時のフォーマット検証規約
  （z.email / z.url / z.iso.datetime 等）と変更後の検証手順をまとめる。
  schemas.ts を編集するとき、または Zod の非推奨 API 警告を直すときに使用する。
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
