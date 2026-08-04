import { Hono } from "hono";
import {
  CreateStudyRecordRequestSchema,
  ListStudyRecordsQuerySchema,
} from "../../../shared/schemas";
import {
  createStudyRecord,
  getOtherGroupMemberUserIds,
  isUserInGroup,
  listStudyRecords,
} from "../lib/db";
import type { PushQueueMessage } from "../lib/push";
import type { AuthVariables } from "../middleware/requireAuth";

/**
 * 学習記録API
 * - GET  /:groupId/records  記録一覧（カーソルページネーション、新しい順）
 * - POST /:groupId/records  記録投稿（成功時にPush用QueueへEnqueue）
 * requireAuthはindex.tsでマウント時に適用される。
 */
export const recordsRoutes = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

recordsRoutes.get("/:groupId/records", async (c) => {
  const user = c.get("user");
  const groupId = c.req.param("groupId");

  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }

  const parsedQuery = ListStudyRecordsQuerySchema.safeParse({
    cursor: c.req.query("cursor"),
    limit: c.req.query("limit"),
  });
  if (!parsedQuery.success) {
    return c.json(
      { error: "invalid_request", issues: parsedQuery.error.issues },
      400,
    );
  }

  const page = await listStudyRecords(c.env.DB, groupId, parsedQuery.data);
  return c.json({ records: page.items, nextCursor: page.nextCursor });
});

recordsRoutes.post("/:groupId/records", async (c) => {
  const user = c.get("user");
  const groupId = c.req.param("groupId");

  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = CreateStudyRecordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  const record = await createStudyRecord(c.env.DB, {
    id: crypto.randomUUID(),
    groupId,
    userId: user.id,
    studyDate: parsed.data.studyDate,
    title: parsed.data.title,
    durationMinutes: parsed.data.durationMinutes,
    memo: parsed.data.memo,
  });

  // 投稿成功: 投稿者以外のグループメンバー1人につき1メッセージをQueueへenqueueする。
  // Push送信自体は queue() ハンドラ側で非同期に行うため、ここでのenqueue失敗は
  // 記録投稿自体の成否には影響させない（ベストエフォート）。
  try {
    const recipientUserIds = await getOtherGroupMemberUserIds(
      c.env.DB,
      groupId,
      user.id,
    );
    await Promise.all(
      recipientUserIds.map((recipientUserId) => {
        const message: PushQueueMessage = {
          userId: recipientUserId,
          notification: {
            title: `${user.displayName}さんが学習記録を投稿しました`,
            body: record.title,
            data: { groupId, recordId: record.id },
          },
        };
        return c.env.PUSH_QUEUE.send(message);
      }),
    );
  } catch (error) {
    console.error("Failed to enqueue push notifications", error);
  }

  return c.json({ record }, 201);
});
