/**
 * パスワードハッシュ関連ユーティリティ（Web Crypto PBKDF2）。
 *
 * `scripts/seed-users.mjs` と完全に同一のアルゴリズムでハッシュ化を行う:
 * PBKDF2(SHA-256, 100,000 iterations, 32byte導出)。saltは16byteのランダム値を
 * hex文字列としてDBに保存する。
 */

const PBKDF2_ITERATIONS = 100_000;
const DERIVED_KEY_BITLEN = 256; // 32byte

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 16byteのランダムsalt(hex文字列)を生成する。 */
export function generateSaltHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(bytes);
}

/**
 * PBKDF2(SHA-256)でパスワードをハッシュ化する。
 * `scripts/seed-users.mjs` の `hashPassword` と同一ロジック。
 */
export async function hashPassword(
  password: string,
  saltHex: string,
): Promise<string> {
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    DERIVED_KEY_BITLEN,
  );
  return bytesToHex(derivedBits);
}

/**
 * 平文パスワードが保存済みのハッシュ・saltと一致するか検証する。
 * タイミング攻撃を避けるため定数時間比較を行う。
 */
export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string,
): Promise<boolean> {
  const actualHashHex = await hashPassword(password, saltHex);
  return timingSafeEqualHex(actualHashHex, expectedHashHex);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
