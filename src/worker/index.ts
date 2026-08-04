import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { groupsRoutes } from "./routes/groups";
import { recordsRoutes } from "./routes/records";
import { pushRoutes } from "./routes/push";
import { requireAuth, type AuthVariables } from "./middleware/requireAuth";
import { getPushSubscriptionsForUser } from "./lib/db";
import { sendPushNotification, type PushQueueMessage } from "./lib/push";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// 認証必須: POST /api/auth/login と GET /api/push/vapid-public-key のみ公開。
// それ以外の /api/auth/*（logout, me）と /api/push/subscribe は各ルートファイル内で
// requireAuth を個別に適用し、/api/groups 以下は丸ごとrequireAuth必須にする。
app.route("/api/auth", authRoutes);
app.use("/api/groups/*", requireAuth);
app.route("/api/groups", groupsRoutes);
app.route("/api/groups", recordsRoutes);
app.route("/api/push", pushRoutes);

export default {
	fetch: app.fetch,
	// `push-notifications` Queueのコンシューマ処理。
	// バッチ内の各メッセージ(受信ユーザー1人分)についてpush_subscriptionsを取得し、
	// lib/push.tsで送信する。成功/失敗(410/404)をハンドリングした上でack()する
	// （enqueue側で1メンバー1メッセージにしているため、1メッセージの失敗が
	// 他メンバーへの通知に影響しない設計）。
	async queue(
		batch: MessageBatch<unknown>,
		env: Env,
	): Promise<void> {
		for (const message of batch.messages) {
			try {
				const { userId, notification } = message.body as PushQueueMessage;
				const subscriptions = await getPushSubscriptionsForUser(env.DB, userId);

				const results = await Promise.allSettled(
					subscriptions.map((subscription) =>
						sendPushNotification(env, subscription, notification),
					),
				);

				for (const result of results) {
					if (result.status === "rejected") {
						console.error("Failed to send push notification", result.reason);
					} else if (!result.value.ok && !result.value.removed) {
						console.error(
							`Push notification failed with status ${result.value.status} for subscription ${result.value.subscriptionId}`,
						);
					}
				}
			} catch (error) {
				console.error("Failed to process push queue message", error);
			}

			// 個々の購読への送信可否に関わらず、メッセージ自体は処理済みとしてackする。
			message.ack();
		}
	},
} satisfies ExportedHandler<Env>;
