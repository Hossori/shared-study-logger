/**
 * Worker（API）とフロントエンドの両方から import する HTTP 契約。
 * リクエストスキーマ、レスポンス型、共有 enum・定数、isAdmin など。
 *
 * Zod v4: フォーマット検証は `z.email()`, `z.iso.datetime()` 等を使う（`.agents/skills/zod-schemas/SKILL.md`）。
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

export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === "ADMIN";
}

/** リソース ID。 */
export const ResourceIdSchema = z.uuid();

/** API に載る日時。 */
export const TimestampSchema = z.iso.datetime();

export const OkResponseSchema = z.object({
  ok: z.literal(true),
});
export type OkResponse = z.infer<typeof OkResponseSchema>;

// ---- 認証 -----------------------------------------------------------------

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UserSchema = z.object({
  id: ResourceIdSchema,
  email: z.email(),
  displayName: z.string(),
  role: UserRoleSchema,
  bio: z.string().nullable(),
  avatarKey: AvatarKeySchema.nullable(),
  createdAt: TimestampSchema,
});
export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = z.object({
  user: UserSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UsersResponseSchema = z.object({
  users: z.array(UserSchema),
});
export type UsersResponse = z.infer<typeof UsersResponseSchema>;

/** GET /api/users/:userId — 他ユーザー向け公開プロフィール（email なし） */
export const PublicUserSchema = z.object({
  id: ResourceIdSchema,
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarKey: AvatarKeySchema.nullable(),
  createdAt: TimestampSchema,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const PublicUserResponseSchema = z.object({
  user: PublicUserSchema,
});
export type PublicUserResponse = z.infer<typeof PublicUserResponseSchema>;

/** PATCH /api/auth/me — プロフィール更新 */
export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(50),
  bio: z.string().max(500).nullable(),
  avatarKey: AvatarKeySchema.nullable(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

/** POST /api/auth/password — パスワード変更 */
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

// ---- グループ ---------------------------------------------------------------

export const GroupSchema = z.object({
  id: ResourceIdSchema,
  name: z.string(),
  createdAt: TimestampSchema,
});
export type Group = z.infer<typeof GroupSchema>;

export const GroupsResponseSchema = z.object({
  groups: z.array(GroupSchema),
});
export type GroupsResponse = z.infer<typeof GroupsResponseSchema>;

export const GroupResponseSchema = z.object({
  group: GroupSchema,
});
export type GroupResponse = z.infer<typeof GroupResponseSchema>;

/** POST /api/admin/users — 管理者によるユーザー作成 */
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
  userId: ResourceIdSchema,
});
export type AddGroupMemberRequest = z.infer<typeof AddGroupMemberRequestSchema>;

/** GET /api/groups/:groupId/members — 所属メンバーの公開情報 */
export const GroupMemberSchema = z.object({
  id: ResourceIdSchema,
  displayName: z.string(),
  avatarKey: AvatarKeySchema.nullable(),
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;

export const GroupMembersResponseSchema = z.object({
  members: z.array(GroupMemberSchema),
});
export type GroupMembersResponse = z.infer<typeof GroupMembersResponseSchema>;

/** POST /api/admin/groups/:groupId/members — 追加したユーザー */
export const AdminMemberResponseSchema = z.object({
  member: UserSchema,
});
export type AdminMemberResponse = z.infer<typeof AdminMemberResponseSchema>;

/** GET /api/admin/groups — 全グループ + メンバー（管理用） */
export const AdminGroupSchema = GroupSchema.extend({
  members: z.array(UserSchema),
});
export type AdminGroup = z.infer<typeof AdminGroupSchema>;

export const AdminGroupsResponseSchema = z.object({
  groups: z.array(AdminGroupSchema),
});
export type AdminGroupsResponse = z.infer<typeof AdminGroupsResponseSchema>;

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
  smile: "ニッコリ",
  laugh: "笑う",
  astonished: "驚く",
  cry: "泣く",
  muscle: "がんばれ",
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
  userId: ResourceIdSchema,
  displayName: z.string(),
});
export type RecordReactionEntry = z.infer<typeof RecordReactionEntrySchema>;

export const RecordReactionResponseSchema = z.object({
  reaction: RecordReactionEntrySchema,
});
export type RecordReactionResponse = z.infer<
  typeof RecordReactionResponseSchema
>;

export const RecordReactionsResponseSchema = z.object({
  reactions: z.array(RecordReactionEntrySchema),
});
export type RecordReactionsResponse = z.infer<
  typeof RecordReactionsResponseSchema
>;

// ---- 学習記録 ---------------------------------------------------------------

/** 学習時間（分）。任意項目。UI は 5 分刻み。上限は 23 時間 55 分。 */
export const DURATION_MINUTES_STEP = 5;
export const DURATION_MINUTES_MIN = 5;
export const DURATION_MINUTES_MAX = 1435;

export const DurationMinutesSchema = z
  .number()
  .int()
  .min(DURATION_MINUTES_MIN)
  .max(DURATION_MINUTES_MAX)
  .multipleOf(DURATION_MINUTES_STEP);

/** studyDatetime 未指定（null）かつ durationMinutes が明示的に非 null なら拒否。 */
function refineStudyDatetimeDurationRule(
  data: { studyDatetime: string | null; durationMinutes?: number | null },
  ctx: z.RefinementCtx,
): void {
  if (
    data.studyDatetime == null &&
    data.durationMinutes != null &&
    data.durationMinutes !== undefined
  ) {
    ctx.addIssue({
      code: "custom",
      message: "study_time_pair_required",
      path: ["studyDatetime"],
    });
  }
}

export const StudyRecordSchema = z.object({
  id: ResourceIdSchema,
  groupId: ResourceIdSchema,
  userId: ResourceIdSchema,
  authorDisplayName: z.string().optional(),
  authorAvatarKey: AvatarKeySchema.nullable().optional(),
  studyDatetime: TimestampSchema,
  title: z.string().min(1),
  durationMinutes: DurationMinutesSchema.nullable(),
  memo: z.string().optional().nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  reactions: z.array(ReactionSummarySchema),
});
export type StudyRecord = z.infer<typeof StudyRecordSchema>;

export const StudyRecordResponseSchema = z.object({
  record: StudyRecordSchema,
});
export type StudyRecordResponse = z.infer<typeof StudyRecordResponseSchema>;

export const StudyRecordsResponseSchema = z.object({
  records: z.array(StudyRecordSchema),
  nextCursor: z.string().nullable(),
});
export type StudyRecordsResponse = z.infer<typeof StudyRecordsResponseSchema>;

export const CreateStudyRecordRequestSchema = z
  .object({
    studyDatetime: z.iso.datetime().nullable(),
    title: z.string().min(1).max(200),
    durationMinutes: DurationMinutesSchema.nullable().optional(),
    memo: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => refineStudyDatetimeDurationRule(data, ctx));
export type CreateStudyRecordRequest = z.infer<
  typeof CreateStudyRecordRequestSchema
>;

export const UpdateStudyRecordRequestSchema = z
  .object({
    studyDatetime: z.iso.datetime().nullable(),
    title: z.string().min(1).max(200),
    durationMinutes: DurationMinutesSchema.nullable().optional(),
    memo: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => refineStudyDatetimeDurationRule(data, ctx));
export type UpdateStudyRecordRequest = z.infer<
  typeof UpdateStudyRecordRequestSchema
>;

function normalizeUserIdsQuery(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  const list = Array.isArray(value) ? value : [value];
  const ids = list.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return ids.length === 0 ? undefined : ids;
}

// カーソルページネーション（`GET /api/groups/:groupId/records`）用のクエリ
export const ListStudyRecordsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userIds: z.preprocess(
    normalizeUserIdsQuery,
    z.array(ResourceIdSchema).max(50).optional(),
  ),
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

export const VapidPublicKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
});
export type VapidPublicKeyResponse = z.infer<
  typeof VapidPublicKeyResponseSchema
>;

// ---- アプリ内通知 -----------------------------------------------------------

export const InAppNotificationSchema = z.object({
  id: ResourceIdSchema,
  title: z.string(),
  body: z.string(),
  enabled: z.boolean(),
  createdBy: ResourceIdSchema.nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type InAppNotification = z.infer<typeof InAppNotificationSchema>;

export const InAppNotificationResponseSchema = z.object({
  notification: InAppNotificationSchema,
});
export type InAppNotificationResponse = z.infer<
  typeof InAppNotificationResponseSchema
>;

export const InAppNotificationsResponseSchema = z.object({
  notifications: z.array(InAppNotificationSchema),
});
export type InAppNotificationsResponse = z.infer<
  typeof InAppNotificationsResponseSchema
>;

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
