/**
 * Workers KV(`SESSIONS`)を使ったセッション管理ユーティリティ。
 * `session:{token}` -> `{ userId, expiresAt }` を保存する。
 * KVのTTL機能(`expirationTtl`)でexpireを管理し、ログアウト時は明示的に削除する。
 */

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30日
const SESSION_KEY_PREFIX = "session:";

export interface SessionData {
  userId: string;
  expiresAt: number; // epoch seconds
}

function sessionKey(token: string): string {
  return `${SESSION_KEY_PREFIX}${token}`;
}

/** ランダムなセッショントークンを生成する(base64url、32byte分のエントロピー)。 */
function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * 新規セッションを作成しKVに保存する。
 * @returns 生成されたセッショントークン
 */
export async function createSession(
  kv: KVNamespace,
  userId: string,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<{ token: string; expiresAt: number }> {
  const token = generateSessionToken();
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const data: SessionData = { userId, expiresAt };
  await kv.put(sessionKey(token), JSON.stringify(data), {
    expirationTtl: ttlSeconds,
  });
  return { token, expiresAt };
}

/** セッショントークンからセッション情報を取得する。存在しない/失効している場合はnull。 */
export async function getSession(
  kv: KVNamespace,
  token: string,
): Promise<SessionData | null> {
  const raw = await kv.get(sessionKey(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/** セッションを削除する(ログアウト)。 */
export async function destroySession(
  kv: KVNamespace,
  token: string,
): Promise<void> {
  await kv.delete(sessionKey(token));
}
