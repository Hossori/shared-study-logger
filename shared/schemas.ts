/**
 * Worker（API）とフロントエンドの両方から import する HTTP 契約。
 * 実行時スキーマの正本は openapi/api.yaml → Orval 生成（shared/generated/api.zod.ts）。
 * trim・横断制約・クエリ正規化など OAS に載せない差分は本ファイルで overlay する。
 */
import { z } from "zod";
import {
  AddGroupMemberRequest as AddGroupMemberRequestGen,
  AddRecordReactionRequest as AddRecordReactionRequestGen,
  AdminGroup as AdminGroupSchemaGen,
  AdminGroupsResponse as AdminGroupsResponseSchemaGen,
  AdminMemberResponse as AdminMemberResponseSchemaGen,
  AvatarKey as AvatarKeySchemaGen,
  ChangePasswordRequest as ChangePasswordRequestSchemaGen,
  CreateAdminGroupRequest as CreateAdminGroupRequestGen,
  CreateAdminUserRequest as CreateAdminUserRequestGen,
  CreateInAppNotificationRequest as CreateInAppNotificationRequestGen,
  CreateStudyRecordRequest as CreateStudyRecordRequestGen,
  createStudyRecordRequestMemoMax,
  createStudyRecordRequestTitleMax,
  DurationMinutes as DurationMinutesSchemaGen,
  DurationMinutesMax,
  DurationMinutesMin,
  DurationMinutesMultipleOf,
  Group as GroupSchemaGen,
  GroupMember as GroupMemberSchemaGen,
  GroupMembersResponse as GroupMembersResponseSchemaGen,
  GroupResponse as GroupResponseSchemaGen,
  GroupsResponse as GroupsResponseSchemaGen,
  HealthResponse as HealthResponseSchemaGen,
  InAppNotification as InAppNotificationSchemaGen,
  InAppNotificationResponse as InAppNotificationResponseSchemaGen,
  InAppNotificationsResponse as InAppNotificationsResponseSchemaGen,
  LoginRequest as LoginRequestSchemaGen,
  OkResponse as OkResponseSchemaGen,
  PublicUser as PublicUserSchemaGen,
  PublicUserResponse as PublicUserResponseSchemaGen,
  PushSubscription as PushSubscriptionSchemaGen,
  ReactionStamp as ReactionStampSchemaGen,
  ReactionSummary as ReactionSummarySchemaGen,
  RecordReactionEntry as RecordReactionEntrySchemaGen,
  RecordReactionResponse as RecordReactionResponseSchemaGen,
  RecordReactionsResponse as RecordReactionsResponseSchemaGen,
  ResourceId as ResourceIdSchemaGen,
  StudyRecord as StudyRecordSchemaGen,
  StudyRecordResponse as StudyRecordResponseSchemaGen,
  StudyRecordsResponse as StudyRecordsResponseSchemaGen,
  Timestamp as TimestampSchemaGen,
  UpdateInAppNotificationRequest as UpdateInAppNotificationRequestSchemaGen,
  UpdateProfileRequest as UpdateProfileRequestGen,
  UpdateStudyRecordRequest as UpdateStudyRecordRequestGen,
  User as UserSchemaGen,
  UserResponse as UserResponseSchemaGen,
  UserRole as UserRoleSchemaGen,
  UsersResponse as UsersResponseSchemaGen,
  VapidPublicKeyResponse as VapidPublicKeyResponseSchemaGen,
} from "./generated/api.zod";

export {
  AVATAR_KEYS,
  AVATAR_PATHS,
  getAvatarUrl,
  type AvatarKey,
} from "./avatars";

export const AvatarKeySchema = AvatarKeySchemaGen;

// ---- ロール ---------------------------------------------------------------

export const USER_ROLES = UserRoleSchemaGen.options as unknown as readonly [
  "ADMIN",
  "USER",
];
export const UserRoleSchema = UserRoleSchemaGen;
export type UserRole = z.infer<typeof UserRoleSchema>;

export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === "ADMIN";
}

/** リソース ID。 */
export const ResourceIdSchema = ResourceIdSchemaGen;

/** API に載る日時。 */
export const TimestampSchema = TimestampSchemaGen;

export const HealthResponseSchema = HealthResponseSchemaGen;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const OkResponseSchema = OkResponseSchemaGen;
export type OkResponse = z.infer<typeof OkResponseSchema>;

// ---- 認証 -----------------------------------------------------------------

export const LoginRequestSchema = LoginRequestSchemaGen;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UserSchema = UserSchemaGen;
export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = UserResponseSchemaGen;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UsersResponseSchema = UsersResponseSchemaGen;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;

/** GET /api/users/:userId — 他ユーザー向け公開プロフィール（email なし） */
export const PublicUserSchema = PublicUserSchemaGen;
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const PublicUserResponseSchema = PublicUserResponseSchemaGen;
export type PublicUserResponse = z.infer<typeof PublicUserResponseSchema>;

/** PATCH /api/auth/me — プロフィール更新 */
export const UpdateProfileRequestSchema = UpdateProfileRequestGen.extend({
  displayName: z.string().trim().min(1).max(50),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

/** POST /api/auth/password — パスワード変更 */
export const ChangePasswordRequestSchema = ChangePasswordRequestSchemaGen;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

// ---- グループ ---------------------------------------------------------------

export const GroupSchema = GroupSchemaGen;
export type Group = z.infer<typeof GroupSchema>;

export const GroupsResponseSchema = GroupsResponseSchemaGen;
export type GroupsResponse = z.infer<typeof GroupsResponseSchema>;

export const GroupResponseSchema = GroupResponseSchemaGen;
export type GroupResponse = z.infer<typeof GroupResponseSchema>;

/** POST /api/admin/users — 管理者によるユーザー作成 */
export const CreateAdminUserRequestSchema = CreateAdminUserRequestGen.extend({
  displayName: z.string().trim().min(1).max(50),
});
export type CreateAdminUserRequest = z.infer<
  typeof CreateAdminUserRequestSchema
>;

/** POST /api/admin/groups — 管理者によるグループ作成 */
export const CreateAdminGroupRequestSchema = CreateAdminGroupRequestGen.extend({
  name: z.string().trim().min(1).max(100),
});
export type CreateAdminGroupRequest = z.infer<
  typeof CreateAdminGroupRequestSchema
>;

/** POST /api/admin/groups/:groupId/members — 所属追加 */
export const AddGroupMemberRequestSchema = AddGroupMemberRequestGen;
export type AddGroupMemberRequest = z.infer<typeof AddGroupMemberRequestSchema>;

/** GET /api/groups/:groupId/members — 所属メンバーの公開情報 */
export const GroupMemberSchema = GroupMemberSchemaGen;
export type GroupMember = z.infer<typeof GroupMemberSchema>;

export const GroupMembersResponseSchema = GroupMembersResponseSchemaGen;
export type GroupMembersResponse = z.infer<typeof GroupMembersResponseSchema>;

/** POST /api/admin/groups/:groupId/members — 追加したユーザー */
export const AdminMemberResponseSchema = AdminMemberResponseSchemaGen;
export type AdminMemberResponse = z.infer<typeof AdminMemberResponseSchema>;

/** GET /api/admin/groups — 全グループ + メンバー（管理用） */
export const AdminGroupSchema = AdminGroupSchemaGen;
export type AdminGroup = z.infer<typeof AdminGroupSchema>;

export const AdminGroupsResponseSchema = AdminGroupsResponseSchemaGen;
export type AdminGroupsResponse = z.infer<typeof AdminGroupsResponseSchema>;

// ---- リアクションスタンプ -------------------------------------------------

export const REACTION_STAMPS =
  ReactionStampSchemaGen.options as unknown as readonly [
    "thumbs_up",
    "smile",
    "laugh",
    "astonished",
    "cry",
    "muscle",
  ];

export const ReactionStampSchema = ReactionStampSchemaGen;
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

export const ReactionSummarySchema = ReactionSummarySchemaGen;
export type ReactionSummary = z.infer<typeof ReactionSummarySchema>;

export const AddRecordReactionRequestSchema = AddRecordReactionRequestGen;
export type AddRecordReactionRequest = z.infer<
  typeof AddRecordReactionRequestSchema
>;

export const RecordReactionEntrySchema = RecordReactionEntrySchemaGen;
export type RecordReactionEntry = z.infer<typeof RecordReactionEntrySchema>;

export const RecordReactionResponseSchema = RecordReactionResponseSchemaGen;
export type RecordReactionResponse = z.infer<
  typeof RecordReactionResponseSchema
>;

export const RecordReactionsResponseSchema = RecordReactionsResponseSchemaGen;
export type RecordReactionsResponse = z.infer<
  typeof RecordReactionsResponseSchema
>;

// ---- 学習記録 ---------------------------------------------------------------

/** 学習時間（分）。任意項目。UI は 5 分刻み。上限は 23 時間 55 分。 */
export const DURATION_MINUTES_STEP = DurationMinutesMultipleOf;
export const DURATION_MINUTES_MIN = DurationMinutesMin;
export const DURATION_MINUTES_MAX = DurationMinutesMax;

export const RECORD_TITLE_MAX = createStudyRecordRequestTitleMax;
export const RECORD_MEMO_MAX = createStudyRecordRequestMemoMax;

export const DurationMinutesSchema = DurationMinutesSchemaGen;

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

export const StudyRecordSchema = StudyRecordSchemaGen;
export type StudyRecord = z.infer<typeof StudyRecordSchema>;

export const StudyRecordResponseSchema = StudyRecordResponseSchemaGen;
export type StudyRecordResponse = z.infer<typeof StudyRecordResponseSchema>;

export const StudyRecordsResponseSchema = StudyRecordsResponseSchemaGen;
export type StudyRecordsResponse = z.infer<typeof StudyRecordsResponseSchema>;

export const CreateStudyRecordRequestSchema =
  CreateStudyRecordRequestGen.superRefine((data, ctx) =>
    refineStudyDatetimeDurationRule(data, ctx),
  );
export type CreateStudyRecordRequest = z.infer<
  typeof CreateStudyRecordRequestSchema
>;

export const UpdateStudyRecordRequestSchema =
  UpdateStudyRecordRequestGen.superRefine((data, ctx) =>
    refineStudyDatetimeDurationRule(data, ctx),
  );
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
    z.array(ResourceIdSchemaGen).max(50).optional(),
  ),
});
export type ListStudyRecordsQuery = z.infer<typeof ListStudyRecordsQuerySchema>;

// ---- Push通知 ---------------------------------------------------------------

// ブラウザの `PushSubscription.toJSON()` の形に合わせたスキーマ
export const PushSubscriptionSchema = PushSubscriptionSchemaGen;
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;

export const VapidPublicKeyResponseSchema = VapidPublicKeyResponseSchemaGen;
export type VapidPublicKeyResponse = z.infer<
  typeof VapidPublicKeyResponseSchema
>;

// ---- アプリ内通知 -----------------------------------------------------------

export const InAppNotificationSchema = InAppNotificationSchemaGen;
export type InAppNotification = z.infer<typeof InAppNotificationSchema>;

export const InAppNotificationResponseSchema =
  InAppNotificationResponseSchemaGen;
export type InAppNotificationResponse = z.infer<
  typeof InAppNotificationResponseSchema
>;

export const InAppNotificationsResponseSchema =
  InAppNotificationsResponseSchemaGen;
export type InAppNotificationsResponse = z.infer<
  typeof InAppNotificationsResponseSchema
>;

export const CreateInAppNotificationRequestSchema =
  CreateInAppNotificationRequestGen.extend({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(2000),
  });
export type CreateInAppNotificationRequest = z.infer<
  typeof CreateInAppNotificationRequestSchema
>;

export const UpdateInAppNotificationRequestSchema =
  UpdateInAppNotificationRequestSchemaGen;
export type UpdateInAppNotificationRequest = z.infer<
  typeof UpdateInAppNotificationRequestSchema
>;
