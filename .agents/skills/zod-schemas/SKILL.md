---
name: zod-schemas
description: >-
  shared/schemas.ts の Zod v4 フォーマット検証（z.email / z.url / z.iso.datetime）と
  変更後の check:zod-deprecated。schemas.ts の編集、Zod スキーマ追加、非推奨 API 警告のときに使用する。
paths: shared/schemas.ts,shared/avatars.ts
---

# Zod スキーマ規約

HTTP の形の正本は [openapi/api.yaml](/openapi/api.yaml)。Orval が [shared/generated/api.zod.ts](/shared/generated/api.zod.ts) を生成し、[shared/schemas.ts](/shared/schemas.ts) が既存 export 名のファサードになる。trim・横断制約・クエリ正規化など OAS に載せない overlay だけ `shared/schemas.ts` に書く。

`shared/schemas.ts` または OAS を変更するときだけ読む。

## 使う API

| 用途 | API |
| ---- | --- |
| email | `z.email()` |
| URL | `z.url()` |
| datetime | `z.iso.datetime()` |

旧称（インスタンスメソッド）: `z.string().email()` / `.url()` / `.datetime()`。

日時フィールドはフロントから `toISOString()` で送る。

## 変更後

```bash
pnpm openapi:generate
pnpm openapi:check
pnpm run check:zod-deprecated
pnpm exec tsc -b
```

`tsc -b` と ESLint は `@deprecated` を検出しない。検査スクリプトは `scripts/check-zod-deprecated.mjs`。
