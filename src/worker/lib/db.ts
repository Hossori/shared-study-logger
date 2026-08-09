/**
 * D1(`DB`バインディング)へのクエリヘルパー。
 * ユーザー/グループ取得、記録一覧のカーソルページネーション、記録作成、
 * push_subscriptions CRUDをまとめる。
 */
import type { StudyRecord } from "../../../shared/schemas";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  created_at: string;
}

export interface GroupRow {
  id: string;
  name: string;
  created_at: string;
}

export interface StudyRecordRow {
  id: string;
  group_id: string;
  user_id: string;
  author_display_name: string;
  study_date: string;
  title: string;
  duration_minutes: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

// ---- users ------------------------------------------------------------

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRow | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();
  return row ?? null;
}

export async function getUserById(
  db: D1Database,
  id: string,
): Promise<UserRow | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  return row ?? null;
}

// ---- groups -------------------------------------------------------------

export async function getGroupsForUser(
  db: D1Database,
  userId: string,
): Promise<GroupRow[]> {
  const { results } = await db
    .prepare(
      `SELECT g.* FROM groups g
       INNER JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = ?
       ORDER BY g.created_at ASC`,
    )
    .bind(userId)
    .all<GroupRow>();
  return results ?? [];
}

export async function isUserInGroup(
  db: D1Database,
  userId: string,
  groupId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .first();
  return row !== null;
}

/** 指定グループに所属する他メンバーのuserIdを返す(Push通知の送信対象)。 */
export async function getOtherGroupMemberUserIds(
  db: D1Database,
  groupId: string,
  excludeUserId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      "SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?",
    )
    .bind(groupId, excludeUserId)
    .all<{ user_id: string }>();
  return (results ?? []).map((r) => r.user_id);
}

// ---- study_records --------------------------------------------------------

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

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

function toStudyRecord(row: StudyRecordRow): StudyRecord {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    authorDisplayName: row.author_display_name,
    studyDate: row.study_date,
    title: row.title,
    durationMinutes: row.duration_minutes,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** グループ内の学習記録を新しい順にカーソルページネーションで取得する。 */
export async function listStudyRecords(
  db: D1Database,
  groupId: string,
  options: { cursor?: string; limit: number },
): Promise<CursorPage<StudyRecord>> {
  const { limit } = options;
  const cursorParts = options.cursor ? decodeCursor(options.cursor) : null;

  const baseQuery = `
    SELECT sr.id, sr.group_id, sr.user_id, u.display_name AS author_display_name,
           sr.study_date, sr.title, sr.duration_minutes, sr.memo,
           sr.created_at, sr.updated_at
    FROM study_records sr
    INNER JOIN users u ON u.id = sr.user_id
    WHERE sr.group_id = ?
  `;

  const statement = cursorParts
    ? db
        .prepare(
          `${baseQuery}
           AND (sr.created_at < ? OR (sr.created_at = ? AND sr.id < ?))
           ORDER BY sr.created_at DESC, sr.id DESC
           LIMIT ?`,
        )
        .bind(
          groupId,
          cursorParts.createdAt,
          cursorParts.createdAt,
          cursorParts.id,
          limit + 1,
        )
    : db
        .prepare(
          `${baseQuery}
           ORDER BY sr.created_at DESC, sr.id DESC
           LIMIT ?`,
        )
        .bind(groupId, limit + 1);

  const { results } = await statement.all<StudyRecordRow>();
  const rows = results ?? [];

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow ? encodeCursor(lastRow.created_at, lastRow.id) : null;

  return {
    items: pageRows.map(toStudyRecord),
    nextCursor,
  };
}

export interface CreateStudyRecordInput {
  id: string;
  groupId: string;
  userId: string;
  studyDate: string;
  title: string;
  durationMinutes: number;
  memo?: string | null;
}

export async function createStudyRecord(
  db: D1Database,
  input: CreateStudyRecordInput,
): Promise<StudyRecord> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO study_records
        (id, group_id, user_id, study_date, title, duration_minutes, memo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.groupId,
      input.userId,
      input.studyDate,
      input.title,
      input.durationMinutes,
      input.memo ?? null,
      now,
      now,
    )
    .run();

  const author = await getUserById(db, input.userId);

  return {
    id: input.id,
    groupId: input.groupId,
    userId: input.userId,
    authorDisplayName: author?.display_name,
    studyDate: input.studyDate,
    title: input.title,
    durationMinutes: input.durationMinutes,
    memo: input.memo ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// ---- push_subscriptions -----------------------------------------------

export async function getPushSubscriptionsForUser(
  db: D1Database,
  userId: string,
): Promise<PushSubscriptionRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM push_subscriptions WHERE user_id = ?")
    .bind(userId)
    .all<PushSubscriptionRow>();
  return results ?? [];
}

export interface UpsertPushSubscriptionInput {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  authKey: string;
  userAgent?: string | null;
}

/** endpointをユニークキーとしてupsertする(同一端末からの再登録に対応)。 */
export async function upsertPushSubscription(
  db: D1Database,
  input: UpsertPushSubscriptionInput,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth_key, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth_key = excluded.auth_key,
         user_agent = excluded.user_agent`,
    )
    .bind(
      input.id,
      input.userId,
      input.endpoint,
      input.p256dh,
      input.authKey,
      input.userAgent ?? null,
    )
    .run();
}

export async function deletePushSubscriptionByEndpoint(
  db: D1Database,
  userId: string,
  endpoint: string,
): Promise<void> {
  await db
    .prepare(
      "DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?",
    )
    .bind(userId, endpoint)
    .run();
}

export async function deletePushSubscriptionById(
  db: D1Database,
  id: string,
): Promise<void> {
  await db.prepare("DELETE FROM push_subscriptions WHERE id = ?").bind(id).run();
}
