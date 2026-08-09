# エディタ警告・コード品質チェックリスト

[← SKILL.md](../SKILL.md)

エディタ(Cursor/VSCode)上にだけ表示される警告や、`tsc -b`・ESLintでは検出されないが
放置すべきでない問題への対応をまとめる。過去に実際に発生したケースを具体例として記載しているので、
同種の問題に遭遇した場合はまずここを確認すること。

## 1. tsconfigのproject referenceカバレッジ

このリポジトリはproject references構成（ルートの`tsconfig.json`が`tsconfig.app.json`
（`src/react-app` + `shared`）・`tsconfig.node.json`（`vite.config.ts`のみ）・
`tsconfig.worker.json`（`src/worker` + `shared`）・`tsconfig.sw.json`
（`public/sw.ts`）を`references`で束ねる）を取っている。**新しいディレクトリ・
エントリーポイント（例: `public/`配下の新規スクリプト、`scripts/`配下のNode用スクリプト等）を
追加した際は、必ずどのtsconfigの`include`に含まれるか確認すること。**

- どのtsconfigの`include`にも属さないファイルは、`tsc -b`（コマンドラインのビルド）では
  そもそも型チェック対象に入らないため気付きにくい。一方エディタは、その未所属ファイルを開くと
  「推論プロジェクト」としてTypeScriptの既定lib（`DOM`込みの標準セット）で型チェックしてしまう。
  ファイル内に`/// <reference lib="webworker" />`のようなlib切り替えディレクティブがあると、
  DOM系とWorker系で重複する`self`/`Notification`/`URL`/`FormData`等の型宣言が衝突し、
  的外れな型エラーが大量に表示され続ける。
- **実例**: `public/sw.ts`（vite-plugin-pwaが`injectManifest`戦略で個別ビルドするService
  Worker）がどのtsconfigの`include`にも属していなかったため、上記の誤検出が発生していた。
  `lib: ["ES2020", "WebWorker"]`（DOM libは含めない）を指定した専用の`tsconfig.sw.json`を
  新設し、ルートの`tsconfig.json`の`references`に追加することで解決した
  （[tsconfig.sw.json](/tsconfig.sw.json)参照）。
- **注意**: `pnpm exec tsc -b --clean && pnpm exec tsc -b --pretty false`を実行してエラーが
  出ないからといって、「リポジトリ内の全ファイルが型チェックされている」とは限らない。
  `tsc -b`は`references`に登録された各tsconfigの`include`の範囲しか見ないため、
  どのtsconfigにも属さないファイルは静かにスキップされる。
- **対処手順**:
  1. 新しいトップレベルディレクトリやエントリーポイントを追加したら、既存の
     `tsconfig.*.json`の`include`のいずれかに含まれるか確認する
     （含まれる場合は追加対応不要）。
  2. どれにも含まれない、かつ既存tsconfigとは異なる実行環境（例: `lib`や`target`が違う）
     が必要な場合は、`tsconfig.sw.json`を参考に専用tsconfigを新設し、ルートの
     `tsconfig.json`の`references`配列に追加する。
  3. 対象ファイルをエディタで開き直し、無関係な型エラー（特にグローバル型の重複定義エラー）
     が消えることを確認する。

## 2. 非推奨(deprecated) API

`escape()`/`unescape()`のような非推奨のグローバル関数は使わないこと。

- **実例**: `src/worker/lib/db.ts`の`encodeCursor`/`decodeCursor`
  （カーソルページネーション用のBase64エンコード/デコード）が、UTF-8セーフなBase64変換のために
  `btoa(unescape(encodeURIComponent(str)))` / `decodeURIComponent(escape(atob(cursor)))`という
  非推奨関数を使ったパターンを使用していた。`TextEncoder`/`TextDecoder` + `Uint8Array`を
  使う実装に置き換え済み（既存カーソルとの後方互換性も確認済み）:

```typescript
function encodeCursor(createdAt: string, id: string): string {
  const bytes = new TextEncoder().encode(`${createdAt}|${id}`);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const binary = atob(cursor);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const separatorIndex = decoded.lastIndexOf("|");
    if (separatorIndex === -1) return null;
    return {
      createdAt: decoded.slice(0, separatorIndex),
      id: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}
```

- **実例2（Zod v4の文字列フォーマット系メソッド）**: `shared/schemas.ts`の
  `LoginRequestSchema`/`UserSchema`の`email: z.string().email()`、
  `PushSubscriptionSchema`の`endpoint: z.string().url()`が、エディタ上で`.email()`/`.url()`に
  打消し線として表示されていた。このリポジトリのZod（`^4.4.3`）では、`ZodString`の文字列
  フォーマット系インスタンスメソッド（`.email()`, `.url()`, `.jwt()`, `.emoji()`, `.guid()`,
  `.uuid()`, `.uuidv4/6/7()`, `.nanoid()`, `.cuid()`, `.cuid2()`, `.ulid()`, `.base64()`,
  `.base64url()`, `.xid()`, `.ksuid()`, `.ipv4()`, `.ipv6()`, `.cidrv4()`等）が全て
  deprecatedになっており、代わりにトップレベル関数（`z.email()`, `z.url()`, `z.uuid()`等）を
  使うことが推奨されている。両者は内部的に同じチェック関数（`core._email`/`core._url`等）を
  使っており、`z.infer<>`で推論される型（`string`）・実行時のバリデーション挙動（正しい
  メール/URL形式かどうかの判定）は変わらないため、単純な書き換えで安全に対応できる
  （実際に正しい/不正なメール・URL文字列の両方で新旧の`safeParse`結果が一致することを
  確認済み）:

```typescript
// Before
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// After
export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
```

  - **注意**: `.url()`のような汎用的な名前は、Zod以外のオブジェクト（例:
    リクエスト/レスポンス系オブジェクトの`.url()`など）の同名メソッド呼び出しと衝突しうる。
    置き換え対象が本当にZodの文字列スキーマに対する呼び出しかどうかを個別に確認してから
    書き換えること。
- **心構え**: エディタ上でメソッド名・関数名に打消し線（strikethrough）が表示されたら、
  それはTypeScriptが型定義の`@deprecated` JSDocタグを検出して警告しているサインである。
  無視せず、まず代替APIが無いか確認してから置き換える運用にする。
- **簡易チェックコマンド**: 新しいコードを書く際やPRレビュー時に、非推奨になりがちな
  API・パターンが紛れ込んでいないか以下のようなコマンドで確認できる。

```bash
grep -rn -E 'escape\(|unescape\(|\.substr\(|componentWillMount|findDOMNode' src
```

  Zodの文字列フォーマット系deprecatedメソッドは以下のような専用コマンドで検出できる
  （ヒットしても、前述の注意点のとおりZod以外の同名メソッド呼び出しが混じる可能性があるので、
  1件ずつ実際にZodのstringスキーマへの呼び出しか確認すること）:

```bash
grep -rnE '\.(email|url|jwt|emoji|guid|uuid|uuidv4|uuidv6|uuidv7|nanoid|cuid|cuid2|ulid|base64|base64url|xid|ksuid|ipv4|ipv6|cidrv4)\(' src shared
```

## 3. Tailwindのアービトラリバリュー方針

rem/px等の固定長さの値をクラスに指定する際は、まずTailwindの既定スペーシングスケール
（`spacing`。Tailwind v4では`node_modules/tailwindcss/theme.css`の
`--spacing: 0.25rem`を基準に`calc(var(--spacing) * N)`で生成される数値スケール）で
表現できないか確認し、一致する場合は必ず標準の数値クラス（`max-w-32`, `w-40`等）を使うこと。
アービトラリバリュー（`max-w-[8rem]`のような`[]`表記）は既定スケールでは表現できない場合の
最終手段とする。

- **実例**: `src/react-app/components/Layout.tsx`の`max-w-[8rem]`・`max-w-[10rem]`、
  `src/react-app/features/groups/GroupSwitcher.tsx`の`max-w-[10rem]`は、
  いずれも既定スケールにちょうど一致していた（`8rem = 0.25rem × 32`、
  `10rem = 0.25rem × 40`）ため、`max-w-32`・`max-w-40`にそれぞれ置き換えた
  （生成CSSの`max-width`値が変更前後で完全一致することを確認済み）。
- **対象外の例**: `src/react-app/features/records/PostRecordModal.tsx`の`max-h-[90vh]`は
  ビューポート高さに対する相対値であり、`rem`ベースのスペーシングスケールとは性質が
  異なるため、意図的にアービトラリバリューのまま維持している。`vh`/`vw`/`dvh`等の
  ビューポート相対単位は本チェックの対象外。
- **既定スケールに一致しない場合**: `@theme`でのカスタムトークン化を検討するか、
  デザイン上の意図を示すコメントを添えた上でアービトラリバリューを使う。
- **検出コマンド**: PRレビュー時やリファクタリング時に、`rem`/`px`のアービトラリバリューが
  紛れ込んでいないか以下のようなコマンドで洗い出せる。ヒットした値を`0.25rem`（=4px、
  v4既定の`--spacing`）で割って整数になれば、対応する標準クラス（`w-{値}`等）に
  置き換えられないか検討する。

```bash
grep -rnE '\[[0-9.]+(rem|px)\]' src
```

## まとめ: PRレビュー時のチェックリスト

- [ ] 新しいディレクトリ・エントリーポイントを追加した場合、いずれかのtsconfigの`include`に
      含まれているか（属さない場合、専用tsconfigを新設し`tsconfig.json`の`references`に追加）
- [ ] `escape`/`unescape`等の非推奨グローバル関数や、エディタ上で打消し線が付いたAPIを
      使っていないか
- [ ] Zodの`.email()`/`.url()`/`.uuid()`等、文字列フォーマット系のdeprecatedな
      インスタンスメソッドを使っていないか（`z.email()`/`z.url()`/`z.uuid()`等の
      トップレベル関数を使う）
- [ ] `rem`/`px`のアービトラリバリューが、Tailwindの既定スペーシングスケールの数値クラスで
      置き換えられないか（`vh`/`vw`/`dvh`等のビューポート相対値は対象外）
