/**
 * Web Push送信ユーティリティ（`@pushforge/builder` を使用）。
 * VAPID署名・ペイロード暗号化(aes128gcm)を行い、購読先endpointへfetchでPOSTする。
 * 410/404応答時は該当購読をD1から削除する（期限切れ購読のクリーンアップ）。
 */
import { buildPushHTTPRequest, type PushMessage } from "@pushforge/builder";
import type { PushSubscriptionRow } from "./db";
import { deletePushSubscriptionById } from "./db";

/**
 * `PUSH_QUEUE` にenqueueするメッセージの形。1メッセージ = 1受信ユーザー分の通知。
 * `routes/records.ts` の投稿成功時と `index.ts` の `queue()` ハンドラで共有する。
 */
export interface PushQueueMessage {
  userId: string;
  notification: {
    title: string;
    body: string;
    data?: {
      groupId: string;
      recordId: string;
      url?: string;
    };
  };
}

export interface SendPushResult {
  subscriptionId: string;
  ok: boolean;
  status: number;
  /** 購読が無効(410 Gone / 404 Not Found)だったためD1から削除した場合true */
  removed: boolean;
}

/**
 * 1件の購読に対してPush通知を送信する。
 * 410/404の場合は呼び出し側のDB(env.DB)から購読を削除する。
 */
export async function sendPushNotification(
  env: Env,
  subscription: PushSubscriptionRow,
  payload: PushMessage["payload"],
): Promise<SendPushResult> {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: env.VAPID_PRIVATE_KEY,
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key,
      },
    },
    message: {
      payload,
      adminContact: env.VAPID_ADMIN_CONTACT,
      options: {
        ttl: 60 * 60 * 24, // 24時間
        urgency: "normal",
      },
    },
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
  });

  const isGone = response.status === 410 || response.status === 404;
  if (isGone) {
    await deletePushSubscriptionById(env.DB, subscription.id);
  }

  return {
    subscriptionId: subscription.id,
    ok: response.ok,
    status: response.status,
    removed: isGone,
  };
}
