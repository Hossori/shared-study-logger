import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { groupsRoutes } from "./routes/groups";
import { recordsRoutes } from "./routes/records";
import { usersRoutes } from "./routes/users";
import { pushRoutes } from "./routes/push";
import { requireAuth, type AuthVariables } from "./middleware/requireAuth";
import { getPushSubscriptionsForUser } from "./lib/db";
import { sendPushNotification, type PushQueueMessage } from "./lib/push";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// 認証必須: POST /api/auth/login と GET /api/push/vapid-public-key のみ公開。
// それ以外の /api/auth/*（logout, me, PATCH /me, POST /password）と /api/push/subscribe、
// /api/users/* は各ルートファイル内で requireAuth を個別に適用し、
// /api/groups 以下は丸ごと requireAuth 必須にする。
app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.use("/api/groups/*", requireAuth);
app.route("/api/groups", groupsRoutes);
app.route("/api/groups", recordsRoutes);
app.route("/api/push", pushRoutes);

interface PushQueueDependencies {
	getPushSubscriptionsForUser: typeof getPushSubscriptionsForUser;
	sendPushNotification: typeof sendPushNotification;
}

const defaultPushQueueDependencies: PushQueueDependencies = {
	getPushSubscriptionsForUser,
	sendPushNotification,
};

export async function processPushQueueBatch(
	batch: MessageBatch<unknown>,
	env: Env,
	dependencies: PushQueueDependencies = defaultPushQueueDependencies,
): Promise<void> {
	// `push-notifications` Queueのコンシューマ処理。
	// バッチ内の各メッセージ(受信ユーザー1人分)についてpush_subscriptionsを取得し、
	// lib/push.tsで送信する。成功・失効済み購読(410/404)はackし、それ以外の
	// 一時失敗はretryしてCloudflare Queuesの再試行・DLQ設定に委ねる。
	for (const message of batch.messages) {
		let shouldRetry = false;

		try {
			const { userId, notification } = message.body as PushQueueMessage;
			const subscriptions = await dependencies.getPushSubscriptionsForUser(
				env.DB,
				userId,
			);

			const results = await Promise.allSettled(
				subscriptions.map((subscription) =>
					dependencies.sendPushNotification(env, subscription, notification),
				),
			);

			for (const result of results) {
				if (result.status === "rejected") {
					console.error("Failed to send push notification", result.reason);
					shouldRetry = true;
				} else if (
					!result.value.ok &&
					(!result.value.removed ||
						(result.value.status !== 410 && result.value.status !== 404))
				) {
					console.error(
						`Push notification failed with status ${result.value.status} for subscription ${result.value.subscriptionId}`,
					);
					shouldRetry = true;
				}
			}
		} catch (error) {
			console.error("Failed to process push queue message", error);
			shouldRetry = true;
		}

		if (shouldRetry) {
			message.retry();
		} else {
			message.ack();
		}
	}
}

export default {
	fetch: app.fetch,
	queue: (batch, env) => processPushQueueBatch(batch, env),
} satisfies ExportedHandler<Env>;
