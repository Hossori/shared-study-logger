/**
 * Worker（API）とフロントエンドの両方から import される Zod スキーマ定義。
 *
 * `migrations/0001_init.sql`のデータモデル（ER図は`docs/data-model.md`参照）
 * に基づく最小限の骨格。詳細なバリデーションルール・レスポンス型は各APIエンドポイントを
 * 実装する後続エージェント（backend-auth / backend-records / push-notifications /
 * frontend-store 等）が拡張する。
 */
import { z } from "zod";

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
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// ---- グループ ---------------------------------------------------------------

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});
export type Group = z.infer<typeof GroupSchema>;

// ---- 学習記録 ---------------------------------------------------------------

export const StudyRecordSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  authorDisplayName: z.string().optional(),
  studyDate: z.string(),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  memo: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudyRecord = z.infer<typeof StudyRecordSchema>;

export const CreateStudyRecordRequestSchema = z.object({
  studyDate: z.string(),
  title: z.string().min(1).max(200),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60),
  memo: z.string().max(2000).optional(),
});
export type CreateStudyRecordRequest = z.infer<
  typeof CreateStudyRecordRequestSchema
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
