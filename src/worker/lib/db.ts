/**
 * D1(`DB`バインディング)へのクエリヘルパー。
 * ユーザー/グループ取得、管理者向けユーザー・グループ・所属の作成、
 * 記録一覧のカーソルページネーション、記録の作成/更新/削除、
 * 記録リアクション、push_subscriptions / app_notifications CRUDをまとめる。
 */
import type {
  AvatarKey,
  Group,
  InAppNotification,
  PublicUser,
  ReactionStamp,
  ReactionSummary,
  RecordReactionEntry,
  StudyRecord,
  User,
} from "../../../shared/schemas";
import {
  AvatarKeySchema,
  parseUserRole,
  REACTION_STAMPS,
  ReactionStampSchema,
} from "../../../shared/schemas";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  role: string | null;
  bio: string | null;
  avatar_key: string | null;
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
  author_avatar_key: string | null;
  study_datetime: string;
  title: string;
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

function parseAvatarKey(value: string | null | undefined): AvatarKey | null {
  const parsed = AvatarKeySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** UserRow を API レスポンス用の User に変換する。未知の avatar_key は null 扱い。未知の role は USER。 */
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: parseUserRole(row.role),
    bio: row.bio ?? null,
    avatarKey: parseAvatarKey(row.avatar_key),
    createdAt: row.created_at,
  };
}

/** 公開プロフィール（email を含めない）。 */
export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    displayName: row.display_name,
    bio: row.bio ?? null,
    avatarKey: parseAvatarKey(row.avatar_key),
    createdAt: row.created_at,
  };
}

export interface UpdateUserProfileInput {
  displayName?: string;
  bio?: string | null;
  avatarKey?: AvatarKey | null;
}

export async function updateUserProfile(
  db: D1Database,
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.displayName !== undefined) {
    sets.push("display_name = ?");
    values.push(input.displayName);
  }
  if (input.bio !== undefined) {
    sets.push("bio = ?");
    values.push(input.bio);
  }
  if (input.avatarKey !== undefined) {
    sets.push("avatar_key = ?");
    values.push(input.avatarKey);
  }

  if (sets.length === 0) {
    return getUserById(db, userId);
  }

  values.push(userId);
  await db
    .prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return getUserById(db, userId);
}

export async function updateUserPassword(
  db: D1Database,
  userId: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<void> {
  await db
    .prepare(
      "UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?",
    )
    .bind(passwordHash, passwordSalt, userId)
    .run();
}

/** 全ユーザーを作成順で返す（管理用。password は UserRow に含まれるが API では toUser する）。 */
export async function listUsers(db: D1Database): Promise<UserRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM users ORDER BY created_at ASC, id ASC",
    )
    .all<UserRow>();
  return results ?? [];
}

export interface CreateUserInput {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  displayName: string;
}

/** ユーザーを作成する。role は USER 固定、bio / avatar_key は NULL。 */
export async function createUser(
  db: D1Database,
  input: CreateUserInput,
): Promise<UserRow> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users
        (id, email, password_hash, password_salt, display_name, bio, avatar_key, role, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, 'USER', ?)`,
    )
    .bind(
      input.id,
      input.email,
      input.passwordHash,
      input.passwordSalt,
      input.displayName,
      now,
    )
    .run();

  const row = await getUserById(db, input.id);
  if (!row) {
    throw new Error("failed_to_create_user");
  }
  return row;
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

export function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getGroupById(
  db: D1Database,
  id: string,
): Promise<GroupRow | null> {
  const row = await db
    .prepare("SELECT * FROM groups WHERE id = ?")
    .bind(id)
    .first<GroupRow>();
  return row ?? null;
}

export async function listAllGroups(db: D1Database): Promise<GroupRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM groups ORDER BY created_at ASC, id ASC")
    .all<GroupRow>();
  return results ?? [];
}

export interface GroupWithMembers {
  group: GroupRow;
  members: UserRow[];
}

interface GroupMemberJoinRow extends UserRow {
  group_id: string;
}

/** 全グループをメンバー付きで返す（管理用。所属不問）。 */
export async function listAllGroupsWithMembers(
  db: D1Database,
): Promise<GroupWithMembers[]> {
  const groups = await listAllGroups(db);
  const { results } = await db
    .prepare(
      `SELECT gm.group_id,
              u.id, u.email, u.password_hash, u.password_salt, u.display_name,
              u.role, u.bio, u.avatar_key, u.created_at
       FROM group_members gm
       INNER JOIN users u ON u.id = gm.user_id
       ORDER BY gm.joined_at ASC, u.id ASC`,
    )
    .all<GroupMemberJoinRow>();

  const membersByGroup = new Map<string, UserRow[]>();
  for (const row of results ?? []) {
    const { group_id: groupId, ...user } = row;
    const members = membersByGroup.get(groupId);
    if (members) {
      members.push(user);
    } else {
      membersByGroup.set(groupId, [user]);
    }
  }

  return groups.map((group) => ({
    group,
    members: membersByGroup.get(group.id) ?? [],
  }));
}

export interface CreateGroupInput {
  id: string;
  name: string;
}

export async function createGroup(
  db: D1Database,
  input: CreateGroupInput,
): Promise<GroupRow> {
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)")
    .bind(input.id, input.name, now)
    .run();
  return { id: input.id, name: input.name, created_at: now };
}

export async function addGroupMember(
  db: D1Database,
  groupId: string,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
    )
    .bind(groupId, userId, now)
    .run();
}

/** 所属を削除する。削除できたら true。 */
export async function removeGroupMember(
  db: D1Database,
  groupId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

// ---- study_records --------------------------------------------------------

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

function encodeCursor(
  studyDatetime: string,
  updatedAt: string,
  id: string,
): string {
  const bytes = new TextEncoder().encode(
    `${studyDatetime}|${updatedAt}|${id}`,
  );
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeCursor(
  cursor: string,
): { studyDatetime: string; updatedAt: string; id: string } | null {
  try {
    const binary = atob(cursor);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [studyDatetime, updatedAt, id] = parts;
    if (!studyDatetime || !updatedAt || !id) return null;
    return { studyDatetime, updatedAt, id };
  } catch {
    return null;
  }
}

/** カーソル文字列をパースする。不正な場合は null を返す。 */
export function parseStudyRecordsCursor(
  cursor: string,
): { studyDatetime: string; updatedAt: string; id: string } | null {
  return decodeCursor(cursor);
}

function toStudyRecord(
  row: StudyRecordRow,
  reactions: ReactionSummary[] = [],
): StudyRecord {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    authorDisplayName: row.author_display_name,
    authorAvatarKey: parseAvatarKey(row.author_avatar_key),
    studyDatetime: row.study_datetime,
    title: row.title,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reactions,
  };
}

const STAMP_ORDER = new Map(
  REACTION_STAMPS.map((stamp, index) => [stamp, index]),
);

function sortReactionSummaries(
  summaries: ReactionSummary[],
): ReactionSummary[] {
  return [...summaries].sort(
    (a, b) =>
      (STAMP_ORDER.get(a.stamp) ?? 99) - (STAMP_ORDER.get(b.stamp) ?? 99),
  );
}

interface ReactionAggregateRow {
  record_id: string;
  stamp: string;
  count: number;
  reacted_by_me: number;
}

/** ページ内の記録IDを IN してスタンプ集計する（N+1禁止）。 */
async function listReactionSummariesByRecordIds(
  db: D1Database,
  recordIds: string[],
  currentUserId: string,
): Promise<Map<string, ReactionSummary[]>> {
  const byRecord = new Map<string, ReactionSummary[]>();
  for (const id of recordIds) {
    byRecord.set(id, []);
  }
  if (recordIds.length === 0) {
    return byRecord;
  }

  const placeholders = recordIds.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT record_id, stamp,
              COUNT(*) AS count,
              SUM(user_id = ?) AS reacted_by_me
       FROM record_reactions
       WHERE record_id IN (${placeholders})
       GROUP BY record_id, stamp`,
    )
    .bind(currentUserId, ...recordIds)
    .all<ReactionAggregateRow>();

  for (const row of results ?? []) {
    const stampParsed = ReactionStampSchema.safeParse(row.stamp);
    if (!stampParsed.success) continue;
    const list = byRecord.get(row.record_id);
    if (!list) continue;
    list.push({
      stamp: stampParsed.data,
      count: Number(row.count),
      reactedByMe: Number(row.reacted_by_me) > 0,
    });
  }

  for (const [id, list] of byRecord) {
    byRecord.set(id, sortReactionSummaries(list));
  }
  return byRecord;
}

/** グループ内の学習記録を新しい順にカーソルページネーションで取得する。 */
export async function listStudyRecords(
  db: D1Database,
  groupId: string,
  currentUserId: string,
  options: { cursor?: string; limit: number },
): Promise<CursorPage<StudyRecord>> {
  const { limit } = options;
  const cursorParts = options.cursor ? decodeCursor(options.cursor) : null;
  if (options.cursor && !cursorParts) {
    throw new Error("invalid_cursor");
  }

  const baseQuery = `
    SELECT sr.id, sr.group_id, sr.user_id, u.display_name AS author_display_name,
           u.avatar_key AS author_avatar_key,
           sr.study_datetime, sr.title, sr.memo,
           sr.created_at, sr.updated_at
    FROM study_records sr
    INNER JOIN users u ON u.id = sr.user_id
    WHERE sr.group_id = ?
  `;

  const statement = cursorParts
    ? db
        .prepare(
          `${baseQuery}
           AND (
             sr.study_datetime < ?
             OR (sr.study_datetime = ? AND sr.updated_at < ?)
             OR (sr.study_datetime = ? AND sr.updated_at = ? AND sr.id < ?)
           )
           ORDER BY sr.study_datetime DESC, sr.updated_at DESC, sr.id DESC
           LIMIT ?`,
        )
        .bind(
          groupId,
          cursorParts.studyDatetime,
          cursorParts.studyDatetime,
          cursorParts.updatedAt,
          cursorParts.studyDatetime,
          cursorParts.updatedAt,
          cursorParts.id,
          limit + 1,
        )
    : db
        .prepare(
          `${baseQuery}
           ORDER BY sr.study_datetime DESC, sr.updated_at DESC, sr.id DESC
           LIMIT ?`,
        )
        .bind(groupId, limit + 1);

  const { results } = await statement.all<StudyRecordRow>();
  const rows = results ?? [];

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor(lastRow.study_datetime, lastRow.updated_at, lastRow.id)
      : null;

  const reactionsByRecord = await listReactionSummariesByRecordIds(
    db,
    pageRows.map((row) => row.id),
    currentUserId,
  );

  return {
    items: pageRows.map((row) =>
      toStudyRecord(row, reactionsByRecord.get(row.id) ?? []),
    ),
    nextCursor,
  };
}

export interface CreateStudyRecordInput {
  id: string;
  groupId: string;
  userId: string;
  studyDatetime: string;
  title: string;
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
        (id, group_id, user_id, study_datetime, title, memo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.groupId,
      input.userId,
      input.studyDatetime,
      input.title,
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
    authorAvatarKey: parseAvatarKey(author?.avatar_key),
    studyDatetime: input.studyDatetime,
    title: input.title,
    memo: input.memo ?? null,
    createdAt: now,
    updatedAt: now,
    reactions: [],
  };
}

/** グループ内の学習記録を1件取得する。存在しなければ null。 */
export async function getStudyRecord(
  db: D1Database,
  groupId: string,
  recordId: string,
  currentUserId: string,
): Promise<StudyRecord | null> {
  const row = await db
    .prepare(
      `SELECT sr.id, sr.group_id, sr.user_id, u.display_name AS author_display_name,
              u.avatar_key AS author_avatar_key,
              sr.study_datetime, sr.title, sr.memo,
              sr.created_at, sr.updated_at
       FROM study_records sr
       INNER JOIN users u ON u.id = sr.user_id
       WHERE sr.group_id = ? AND sr.id = ?`,
    )
    .bind(groupId, recordId)
    .first<StudyRecordRow>();
  if (!row) return null;
  const reactionsByRecord = await listReactionSummariesByRecordIds(
    db,
    [row.id],
    currentUserId,
  );
  return toStudyRecord(row, reactionsByRecord.get(row.id) ?? []);
}

export interface UpdateStudyRecordInput {
  studyDatetime: string;
  title: string;
  memo?: string | null;
}

/** 学習記録を更新する。updated_at を現在時刻に更新する。 */
export async function updateStudyRecord(
  db: D1Database,
  groupId: string,
  recordId: string,
  currentUserId: string,
  input: UpdateStudyRecordInput,
): Promise<StudyRecord | null> {
  const existing = await getStudyRecord(db, groupId, recordId, currentUserId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE study_records
       SET study_datetime = ?, title = ?, memo = ?, updated_at = ?
       WHERE group_id = ? AND id = ?`,
    )
    .bind(
      input.studyDatetime,
      input.title,
      input.memo ?? null,
      now,
      groupId,
      recordId,
    )
    .run();

  // 取得〜更新の間に削除された場合など、実際に更新されなければ null
  if ((result.meta.changes ?? 0) === 0) return null;

  return {
    ...existing,
    studyDatetime: input.studyDatetime,
    title: input.title,
    memo: input.memo ?? null,
    updatedAt: now,
  };
}

/** 学習記録を削除する。削除できたら true。 */
export async function deleteStudyRecord(
  db: D1Database,
  groupId: string,
  recordId: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM study_records WHERE group_id = ? AND id = ?")
    .bind(groupId, recordId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export interface AddRecordReactionInput {
  id: string;
  recordId: string;
  userId: string;
  stamp: ReactionStamp;
}

/** 記録にスタンプを付ける。同一ユーザー×同一スタンプが既にあれば null。 */
export async function addRecordReaction(
  db: D1Database,
  input: AddRecordReactionInput,
): Promise<RecordReactionEntry | null> {
  const existing = await db
    .prepare(
      `SELECT id FROM record_reactions
       WHERE record_id = ? AND user_id = ? AND stamp = ?`,
    )
    .bind(input.recordId, input.userId, input.stamp)
    .first<{ id: string }>();
  if (existing) return null;

  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO record_reactions (id, record_id, user_id, stamp, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(input.id, input.recordId, input.userId, input.stamp, now)
    .run();

  const user = await getUserById(db, input.userId);
  return {
    stamp: input.stamp,
    userId: input.userId,
    displayName: user?.display_name ?? "",
  };
}

/** 自分のスタンプ行だけ削除する。削除できたら true。 */
export async function deleteRecordReaction(
  db: D1Database,
  recordId: string,
  userId: string,
  stamp: ReactionStamp,
): Promise<boolean> {
  const result = await db
    .prepare(
      `DELETE FROM record_reactions
       WHERE record_id = ? AND user_id = ? AND stamp = ?`,
    )
    .bind(recordId, userId, stamp)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/** 記録のリアクション一覧（created_at, id 昇順）。 */
export async function listRecordReactions(
  db: D1Database,
  recordId: string,
): Promise<RecordReactionEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT rr.stamp AS stamp, rr.user_id AS user_id,
              u.display_name AS display_name
       FROM record_reactions rr
       INNER JOIN users u ON u.id = rr.user_id
       WHERE rr.record_id = ?
       ORDER BY rr.created_at ASC, rr.id ASC`,
    )
    .bind(recordId)
    .all<{ stamp: string; user_id: string; display_name: string }>();

  const entries: RecordReactionEntry[] = [];
  for (const row of results ?? []) {
    const stampParsed = ReactionStampSchema.safeParse(row.stamp);
    if (!stampParsed.success) continue;
    entries.push({
      stamp: stampParsed.data,
      userId: row.user_id,
      displayName: row.display_name,
    });
  }
  return entries;
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

// ---- app_notifications ------------------------------------------------

export interface AppNotificationRow {
  id: string;
  title: string;
  body: string;
  enabled: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function toInAppNotification(row: AppNotificationRow): InAppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    enabled: Number(row.enabled) === 1,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAppNotifications(
  db: D1Database,
): Promise<InAppNotification[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, body, enabled, created_by, created_at, updated_at
       FROM app_notifications
       ORDER BY created_at DESC, id DESC`,
    )
    .all<AppNotificationRow>();
  return (results ?? []).map(toInAppNotification);
}

export async function listEnabledAppNotifications(
  db: D1Database,
): Promise<InAppNotification[]> {
  const { results } = await db
    .prepare(
      `SELECT id, title, body, enabled, created_by, created_at, updated_at
       FROM app_notifications
       WHERE enabled = 1
       ORDER BY created_at DESC, id DESC`,
    )
    .all<AppNotificationRow>();
  return (results ?? []).map(toInAppNotification);
}

export async function getAppNotification(
  db: D1Database,
  id: string,
): Promise<InAppNotification | null> {
  const row = await db
    .prepare(
      `SELECT id, title, body, enabled, created_by, created_at, updated_at
       FROM app_notifications
       WHERE id = ?`,
    )
    .bind(id)
    .first<AppNotificationRow>();
  return row ? toInAppNotification(row) : null;
}

export interface CreateAppNotificationInput {
  id: string;
  title: string;
  body: string;
  enabled: boolean;
  createdBy: string;
}

export async function createAppNotification(
  db: D1Database,
  input: CreateAppNotificationInput,
): Promise<InAppNotification> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO app_notifications
        (id, title, body, enabled, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.title,
      input.body,
      input.enabled ? 1 : 0,
      input.createdBy,
      now,
      now,
    )
    .run();

  return {
    id: input.id,
    title: input.title,
    body: input.body,
    enabled: input.enabled,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function setAppNotificationEnabled(
  db: D1Database,
  id: string,
  enabled: boolean,
): Promise<InAppNotification | null> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE app_notifications
       SET enabled = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(enabled ? 1 : 0, now, id)
    .run();

  if ((result.meta.changes ?? 0) === 0) return null;

  return getAppNotification(db, id);
}

export async function deleteAppNotification(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM app_notifications WHERE id = ?")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
