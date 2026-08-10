import { Hono } from "hono";
import {
  CreateStudyRecordRequestSchema,
  ListStudyRecordsQuerySchema,
  UpdateStudyRecordRequestSchema,
} from "../../../shared/schemas";
import {
  createStudyRecord,
  deleteStudyRecord,
  getOtherGroupMemberUserIds,
  getStudyRecord,
  isUserInGroup,
  listStudyRecords,
  parseStudyRecordsCursor,
  updateStudyRecord,
} from "../lib/db";
import type { PushQueueMessage } from "../lib/push";
import type { AuthVariables } from "../middleware/requireAuth";

/**
 * 学習記録API
 * - GET    /:groupId/records            記録一覧（カーソルページネーション、新しい順）
 * - POST   /:groupId/records            記録投稿（成功時にPush用QueueへEnqueue）
 * - PATCH  /:groupId/records/:recordId  自分の記録の編集
 * - DELETE /:groupId/records/:recordId  自分の記録の削除
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

  if (
    parsedQuery.data.cursor &&
    !parseStudyRecordsCursor(parsedQuery.data.cursor)
  ) {
    return c.json({ error: "invalid_request", message: "Invalid cursor" }, 400);
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
    studyDatetime: parsed.data.studyDatetime,
    title: parsed.data.title,
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

recordsRoutes.patch("/:groupId/records/:recordId", async (c) => {
  const user = c.get("user");
  const groupId = c.req.param("groupId");
  const recordId = c.req.param("recordId");

  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }

  const existing = await getStudyRecord(c.env.DB, groupId, recordId);
  if (!existing) {
    return c.json({ error: "not_found" }, 404);
  }
  if (existing.userId !== user.id) {
    return c.json({ error: "forbidden" }, 403);
  }

  const json = await c.req.json().catch(() => null);
  const parsed = UpdateStudyRecordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }

  const record = await updateStudyRecord(c.env.DB, groupId, recordId, {
    studyDatetime: parsed.data.studyDatetime,
    title: parsed.data.title,
    memo: parsed.data.memo,
  });
  if (!record) {
    return c.json({ error: "not_found" }, 404);
  }

  return c.json({ record });
});

recordsRoutes.delete("/:groupId/records/:recordId", async (c) => {
  const user = c.get("user");
  const groupId = c.req.param("groupId");
  const recordId = c.req.param("recordId");

  const isMember = await isUserInGroup(c.env.DB, user.id, groupId);
  if (!isMember) {
    return c.json({ error: "forbidden" }, 403);
  }

  const existing = await getStudyRecord(c.env.DB, groupId, recordId);
  if (!existing) {
    return c.json({ error: "not_found" }, 404);
  }
  if (existing.userId !== user.id) {
    return c.json({ error: "forbidden" }, 403);
  }

  const deleted = await deleteStudyRecord(c.env.DB, groupId, recordId);
  if (!deleted) {
    return c.json({ error: "not_found" }, 404);
  }

  return c.json({ ok: true });
});
