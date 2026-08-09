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

## 4. 長いTailwindクラス名の可読性改善方針

1要素に10〜20個のユーティリティクラスを1行の`className`文字列として書くと、JSXの
見通しが悪くなる。このリポジトリでは以下の3つの手法を使い分けて対応する。

`class-variance-authority`(cva)のようなvariant管理ライブラリの導入も検討したが、
`Button.tsx`のvariant数が3個（primary/secondary/ghost）と少なく、`variant`ごとの
クラス自体も1行で十分書ける短さのため、専用ライブラリを導入するほどの複雑さが無いと
判断し見送った（Atomic Designのフル採用を見送った際と同様の「規模に見合った選択をする」
という判断基準。詳細は[design-decisions.md](design-decisions.md)参照）。

### 使い分けの基準

| 状況 | 採用する手法 |
| --- | --- |
| 静的な（値が変わらない）長いクラス文字列（目安: ユーティリティクラス概ね7個以上、または複数の関心事(レイアウト/色/タイポグラフィ/状態バリアント等)が1行に混在） | (c) コンポーネントファイル内のモジュールレベル定数に分割し、意味のある名前を与える |
| 条件分岐・三項演算子でクラスを組み立てる箇所（`status === "subscribed" ? ... : ...`等） | (a) `clsx`ベースの`cn()`ヘルパー（`src/react-app/lib/cn.ts`）で組み立てる |
| 短い（5〜6個以下）かつ単一の関心事に閉じたクラス文字列 | 無理に分割せず、そのままインラインで維持する（過剰な抽象化を避ける） |

### (a) `cn()`ヘルパー（`clsx`ベース、`tailwind-merge`は不採用）

`src/react-app/lib/cn.ts`が`clsx`をラップした`cn(...inputs: ClassValue[]): string`を
提供する。`clsx`は`undefined`/`false`/空文字列を自動的に無視して結合するため、
`` `${a} ${b}`.trim() ``のような手動の`trim()`呼び出しやテンプレートリテラル+三項演算子
より読みやすい。

- **`tailwind-merge`は導入していない**: `tailwind-merge`はクラス名の意味的な重複（例:
  `px-2`と`px-4`が両方渡された場合に後者を勝たせる）を検出するライブラリだが、
  このリポジトリの`variant`用クラス（`Button.tsx`の`variantClassNames`等）と呼び出し側が
  渡す`className`は、色/ホバー系（variant側）と余白/文字サイズ系（呼び出し側）のように
  担当するユーティリティグループが重ならないよう意図的に設計されているため、クラスの
  重複解決自体が発生しない。無い機能のために依存を増やすのは過剰投資と判断し見送った。
  同じユーティリティグループが複数箇所から重ねて渡される書き方が将来必要になった場合は
  再検討すること。
- **適用例**:
  - `components/ui/Button.tsx`: `` `...${variantClassNames[variant]} ${className}`.trim() ``
    という文字列結合を`cn(baseButtonClassName, variantClassNames[variant], className)`に
    置き換えた。
  - `components/ui/FormField.tsx`: `TextField`/`TextAreaField`の`className`結合を同様に
    `cn()`に置き換えた。
  - `features/push/NotificationOptIn.tsx`: 購読状態(`subscribed`/`unsubscribed`)に応じた
    ボタンの色分岐が、`` `...${ 三項演算子 }`.trim() ``というテンプレートリテラル内三項演算子
    (最も読みづらいパターン)になっていたのを、`baseToggleButtonClassName`
    （共通の見た目）+ `subscribedToggleButtonClassName`/`unsubscribedToggleButtonClassName`
    （状態別の色）の3定数 + `cn(base, status === "subscribed" ? a : b)`という条件式に
    分解した。

### (c) モジュールレベル定数への分割

コンポーネントファイルの先頭（`export default function ...`の前）に、意味のある名前を
付けた`const xxxClassName = "..."`を定義する（`FormField.tsx`の`fieldLabelClassName`/
`fieldControlClassName`が既存の先例）。関数コンポーネント内のローカル変数ではなく
モジュールレベル定数にするのは、値が`props`/`state`に依存しない静的な文字列であり、
再レンダリングのたびに再生成する必要が無いため。

- **適用例**:
  - `components/Layout.tsx`: ヘッダー全体を`headerClassName`/`headerRowClassName`/
    `titleClassName`/`desktopActionsClassName`/`userSectionClassName`/
    `desktopUserNameClassName`/`mobileBarClassName`/`mobileUserNameClassName`/
    `mainClassName`/`fabClassName`という10個の名前付き定数に分割した。特に
    `headerRowClassName`（`mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-3
    py-2.5 sm:gap-3 sm:px-6 sm:py-3`、11クラス）と`fabClassName`（15クラス）が対象。
    これによりJSX側は`<header className={headerClassName}>`のように、各要素の役割が
    名前から読み取れるようになった。
  - `features/groups/GroupSwitcher.tsx`: `<select>`の12クラスを`selectClassName`に分割。
  - `features/records/PostRecordModal.tsx`: モーダル外枠を`overlayClassName`
    （背景オーバーレイ）・`panelClassName`（本体パネル）・`closeButtonClassName`
    （閉じるボタン）の3定数に分割。
  - `features/records/RecordsList.tsx`: カードの外枠を`cardClassName`に分割。
  - `features/auth/LoginPage.tsx`・`routes/NotFoundPage.tsx`: ページ全体を覆う
    コンテナ・カード風要素をそれぞれ`containerClassName`等に分割（Layout.tsxほど
    要素数が多くないため2〜3個の定数に留めている）。
- **意図的に分割しなかった例**: `RecordsList.tsx`の`RecordCard`内の日付・学習時間・
  メモ等の各`<p>`/`<span>`（3〜5クラス、単一の関心事＝タイポグラフィ+色のみ）は、
  既に十分短く読みやすいため、そのままインラインで維持している。全クラスを定数化する
  ような過剰な抽象化（例: 全`className`をCSS変数化する等）は行わない。

### (b) `prettier-plugin-tailwindcss`（クラスの並び順の自動統一）

このリポジトリには元々Prettierの設定が存在しなかった（エディタのフォーマッタが
デフォルト設定で整形していたと推測され、`pnpm exec prettier --check`でも大半のファイルは
既定設定のままで整形済みだった）。今回、`prettier`と`prettier-plugin-tailwindcss`を
`devDependencies`に追加し、`.prettierrc.json`でプラグインを有効化した。

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- **効果**: クラスの並び順が自動的に統一される（例: レイアウト→サイズ→余白→色→状態
  バリアントの順）ため、同じ意味のクラス集合でも書き手によって順序がバラバラになる
  ことがなくなり、レビュー時の差分ノイズが減る。クラス名自体の短縮にはならないため、
  (a)(c)の対策と併用する。
- **適用範囲**: `src/react-app/**/*.{ts,tsx}`と`shared/**/*.ts`に限定している
  （`package.json`の`format`/`format:check`スクリプト参照）。`src/worker/`配下は
  Tailwindクラスを含まずこのタスクのスコープ外のため、意図的に対象外にしている
  （将来的に対象を広げる場合は追加のフォーマット差分が出ることに注意）。
- **チェックコマンド**:

```bash
pnpm run format:check # 対象ファイルがPrettier(+クラス順序)に従っているか確認のみ
pnpm run format        # 実際に整形して上書きする
```

- **見た目が変わっていないことの確認方法**: クラスの並び順を変えても生成されるCSS自体
  （Tailwindが実際に出力するスタイル）は変わらない（CSSのカスケードはクラスの並び順
  ではなく、生成されたスタイルシート内の定義順で決まるため）。今回の変更では、
  リファクタリング前後で`pnpm build`が出力する`dist/client/assets/index-*.css`の
  ファイル名（コンテンツハッシュ）が完全一致することを確認済み（=生成CSSがバイト単位で
  同一）。

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
- [ ] 長い（目安7個以上、または関心事が混在する）静的な`className`文字列をモジュール
      レベル定数に分割したか、条件分岐によるクラス組み立ては`cn()`
      （`src/react-app/lib/cn.ts`）を使っているか（`pnpm run format:check`で
      クラスの並び順も統一されているか確認できる）
