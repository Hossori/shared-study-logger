/**
 * `worker-configuration.d.ts`（`wrangler types` で自動生成）は D1/KV/Queue の
 * バインディングのみを型付けする。シークレット・環境変数（`.dev.vars` /
 * `wrangler secret put`）は wrangler.jsonc の `vars` に定義していないため自動生成
 * されず、ここで宣言をマージして型を補う。
 *
 * - VAPID_PUBLIC_KEY: Web Push用VAPID公開鍵（base64url、秘匿不要）
 * - VAPID_PRIVATE_KEY: Web Push用VAPID秘密鍵（JWK形式のJSON文字列、要秘匿）
 * - VAPID_ADMIN_CONTACT: VAPID JWTのsubに使う連絡先（mailto: 形式等）
 */
interface Env {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_ADMIN_CONTACT: string;
}
