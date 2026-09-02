/**
 * Worker（API）とフロントエンドの両方から import される Zod スキーマ定義。
 *
 * `migrations/0001_init.sql`のデータモデル（ER図は`docs/data-model.md`参照）
 * に基づく最小限の骨格。詳細なバリデーションルール・レスポンス型は各APIエンドポイントを
 * 実装する後続エージェント（backend-auth / backend-records / push-notifications /
 * frontend-store 等）が拡張する。
 *
 * Zod v4: フォーマット検証は `z.email()`, `z.iso.datetime()` 等を使う（`.cursor/skills/zod-schemas/SKILL.md`）。
 */
import { z } from "zod";
import { AvatarKeySchema } from "./avatars";

export {
  AVATAR_KEYS,
  AVATAR_PATHS,
  AvatarKeySchema,
  getAvatarUrl,
  type AvatarKey,
} from "./avatars";

// ---- ロール ---------------------------------------------------------------

export const USER_ROLES = ["ADMIN", "USER"] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * DB の role 値を UserRole にする。欠落・未知の値は USER
 * （マイグレーション前後や不正値の安全側デフォルト）。
 */
export function parseUserRole(value: unknown): UserRole {
  const parsed = UserRoleSchema.safeParse(value);
  return parsed.success ? parsed.data : "USER";
}

export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === "ADMIN";
}

// ---- 認証 -----------------------------------------------------------------

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string(),
  role: UserRoleSchema,
  bio: z.string().nullable(),
  avatarKey: AvatarKeySchema.nullable(),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

/** GET /api/users/:userId — 他ユーザー向け公開プロフィール（email なし） */
export const PublicUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarKey: AvatarKeySchema.nullable(),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

/** PATCH /api/auth/me — プロフィール更新（少なくとも1フィールド必須） */
export const UpdateProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    bio: z.string().max(500).nullable().optional(),
    avatarKey: AvatarKeySchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.bio !== undefined ||
      data.avatarKey !== undefined,
    { message: "at_least_one_field_required" },
  );
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

/** POST /api/auth/password — パスワード変更 */
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

// ---- グループ ---------------------------------------------------------------

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});
export type Group = z.infer<typeof GroupSchema>;

/** POST /api/admin/users — 管理者によるユーザー作成（role は USER 固定） */
export const CreateAdminUserRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(50),
});
export type CreateAdminUserRequest = z.infer<
  typeof CreateAdminUserRequestSchema
>;

/** POST /api/admin/groups — 管理者によるグループ作成 */
export const CreateAdminGroupRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateAdminGroupRequest = z.infer<
  typeof CreateAdminGroupRequestSchema
>;

/** POST /api/admin/groups/:groupId/members — 所属追加 */
export const AddGroupMemberRequestSchema = z.object({
  userId: z.string().min(1),
});
export type AddGroupMemberRequest = z.infer<typeof AddGroupMemberRequestSchema>;

/** GET /api/admin/groups — 全グループ + メンバー（管理用） */
export const AdminGroupSchema = GroupSchema.extend({
  members: z.array(UserSchema),
});
export type AdminGroup = z.infer<typeof AdminGroupSchema>;

// ---- リアクションスタンプ -------------------------------------------------

export const REACTION_STAMPS = [
  "thumbs_up",
  "smile",
  "laugh",
  "astonished",
  "cry",
  "muscle",
] as const;

export const ReactionStampSchema = z.enum(REACTION_STAMPS);
export type ReactionStamp = z.infer<typeof ReactionStampSchema>;

/** DB の安定キー → 表示用絵文字（定義順: 👍😊🤣😲😭💪） */
export const REACTION_STAMP_EMOJI: Record<ReactionStamp, string> = {
  thumbs_up: "👍",
  smile: "😊",
  laugh: "🤣",
  astonished: "😲",
  cry: "😭",
  muscle: "💪",
};

/** アクセシブルネーム用の日本語ラベル */
export const REACTION_STAMP_LABEL: Record<ReactionStamp, string> = {
  thumbs_up: "いいね",
  smile: "笑顔",
  laugh: "大笑い",
  astonished: "驚き",
  cry: "泣き顔",
  muscle: "がんばり",
};

export const ReactionSummarySchema = z.object({
  stamp: ReactionStampSchema,
  count: z.number().int().min(1),
  reactedByMe: z.boolean(),
});
export type ReactionSummary = z.infer<typeof ReactionSummarySchema>;

export const AddRecordReactionRequestSchema = z.object({
  stamp: ReactionStampSchema,
});
export type AddRecordReactionRequest = z.infer<
  typeof AddRecordReactionRequestSchema
>;

export const RecordReactionEntrySchema = z.object({
  stamp: ReactionStampSchema,
  userId: z.string(),
  displayName: z.string(),
});
export type RecordReactionEntry = z.infer<typeof RecordReactionEntrySchema>;

// ---- 学習記録 ---------------------------------------------------------------

export const StudyRecordSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  authorDisplayName: z.string().optional(),
  authorAvatarKey: AvatarKeySchema.nullable().optional(),
  studyDatetime: z.string(),
  title: z.string().min(1),
  memo: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reactions: z.array(ReactionSummarySchema),
});
export type StudyRecord = z.infer<typeof StudyRecordSchema>;

export const CreateStudyRecordRequestSchema = z.object({
  studyDatetime: z.iso.datetime(),
  title: z.string().min(1).max(200),
  memo: z.string().max(2000).optional(),
});
export type CreateStudyRecordRequest = z.infer<
  typeof CreateStudyRecordRequestSchema
>;

export const UpdateStudyRecordRequestSchema = z.object({
  studyDatetime: z.iso.datetime(),
  title: z.string().min(1).max(200),
  memo: z.string().max(2000).optional(),
});
export type UpdateStudyRecordRequest = z.infer<
  typeof UpdateStudyRecordRequestSchema
>;

// カーソルページネーション（`GET /api/groups/:groupId/records`）用のクエリ
export const ListStudyRecordsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListStudyRecordsQuery = z.infer<typeof ListStudyRecordsQuerySchema>;

// ---- Push通知 ---------------------------------------------------------------

// ブラウザの `PushSubscription.toJSON()` の形に合わせたスキーマ
export const PushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;

// ---- アプリ内通知 -----------------------------------------------------------

export const InAppNotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  enabled: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InAppNotification = z.infer<typeof InAppNotificationSchema>;

export const CreateInAppNotificationRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  enabled: z.boolean().optional(),
});
export type CreateInAppNotificationRequest = z.infer<
  typeof CreateInAppNotificationRequestSchema
>;

export const UpdateInAppNotificationRequestSchema = z.object({
  enabled: z.boolean(),
});
export type UpdateInAppNotificationRequest = z.infer<
  typeof UpdateInAppNotificationRequestSchema
>;
