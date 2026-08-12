import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PushSubscriptionRow } from "../../src/worker/lib/db";
import type { SendPushResult } from "../../src/worker/lib/push";
import { processPushQueueBatch } from "../../src/worker/index";

const messageBody = {
	userId: "queue-user-id",
	notification: {
		title: "Queue retry",
		body: "Push notification",
	},
};

function sendResult(
	subscriptionId: string,
	overrides: Partial<SendPushResult> = {},
): SendPushResult {
	return {
		subscriptionId,
		ok: true,
		status: 201,
		removed: false,
		...overrides,
	};
}

function createMessage(): {
	message: Message<unknown>;
	ack: ReturnType<typeof vi.fn>;
	retry: ReturnType<typeof vi.fn>;
} {
	const ack = vi.fn();
	const retry = vi.fn();

	return {
		message: {
			id: "queue-message-id",
			timestamp: new Date("2026-08-12T00:00:00.000Z"),
			attempts: 1,
			body: messageBody,
			ack,
			retry,
		},
		ack,
		retry,
	};
}

function createSubscription(id: string): PushSubscriptionRow {
	return {
		id,
		user_id: messageBody.userId,
		endpoint: `https://push.example.test/${id}`,
		p256dh: "p256dh",
		auth_key: "auth",
		user_agent: null,
		created_at: "2026-08-12T00:00:00.000Z",
	};
}

const getPushSubscriptionsForUser = vi.fn();
const sendPushNotification = vi.fn();

async function processMessage(message: Message<unknown>): Promise<void> {
	await processPushQueueBatch(
		{
			messages: [message],
			queue: "push-notifications",
			metadata: {
				metrics: {
					backlogCount: 0,
					backlogBytes: 0,
				},
			},
			retryAll: vi.fn(),
			ackAll: vi.fn(),
		},
		{} as Env,
		{
			getPushSubscriptionsForUser,
			sendPushNotification,
		},
	);
}

describe("push queue consumer", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		getPushSubscriptionsForUser.mockReset();
		sendPushNotification.mockReset();
		getPushSubscriptionsForUser.mockResolvedValue([]);
		vi.spyOn(console, "error").mockImplementation(() => undefined);
	});

	it("acks a message when all subscriptions receive the push", async () => {
		getPushSubscriptionsForUser.mockResolvedValue([
			createSubscription("subscription-success"),
		]);
		sendPushNotification.mockResolvedValue(sendResult("subscription-success"));
		const { message, ack, retry } = createMessage();

		await processMessage(message);

		expect(ack).toHaveBeenCalledOnce();
		expect(retry).not.toHaveBeenCalled();
	});

	it.each([410, 404])(
		"acks a message when subscription cleanup succeeds with HTTP %i",
		async (status) => {
			getPushSubscriptionsForUser.mockResolvedValue([
				createSubscription(`subscription-${status}`),
			]);
			sendPushNotification.mockResolvedValue(
				sendResult(`subscription-${status}`, {
					ok: false,
					status,
					removed: true,
				}),
			);
			const { message, ack, retry } = createMessage();

			await processMessage(message);

			expect(ack).toHaveBeenCalledOnce();
			expect(retry).not.toHaveBeenCalled();
		},
	);

	it("retries a message after a non-expired HTTP failure", async () => {
		getPushSubscriptionsForUser.mockResolvedValue([
			createSubscription("subscription-http-failure"),
		]);
		sendPushNotification.mockResolvedValue(
			sendResult("subscription-http-failure", {
				ok: false,
				status: 503,
			}),
		);
		const { message, ack, retry } = createMessage();

		await processMessage(message);

		expect(retry).toHaveBeenCalledOnce();
		expect(ack).not.toHaveBeenCalled();
	});

	it.each(["network", "VAPID construction"] as const)(
		"retries a message after a %s exception",
		async (failure) => {
			getPushSubscriptionsForUser.mockResolvedValue([
				createSubscription(`subscription-${failure}`),
			]);
			sendPushNotification.mockRejectedValue(new Error(failure));
			const { message, ack, retry } = createMessage();

			await processMessage(message);

			expect(retry).toHaveBeenCalledOnce();
			expect(ack).not.toHaveBeenCalled();
		},
	);

	it("retries a message when loading subscriptions fails", async () => {
		getPushSubscriptionsForUser.mockRejectedValue(
			new Error("D1 temporarily unavailable"),
		);
		const { message, ack, retry } = createMessage();

		await processMessage(message);

		expect(retry).toHaveBeenCalledOnce();
		expect(ack).not.toHaveBeenCalled();
		expect(sendPushNotification).not.toHaveBeenCalled();
	});

	it("retries when only one of multiple subscriptions fails", async () => {
		getPushSubscriptionsForUser.mockResolvedValue([
			createSubscription("subscription-first"),
			createSubscription("subscription-second"),
		]);
		sendPushNotification
			.mockResolvedValueOnce(sendResult("subscription-first"))
			.mockResolvedValueOnce(
				sendResult("subscription-second", {
					ok: false,
					status: 500,
				}),
			);
		const { message, ack, retry } = createMessage();

		await processMessage(message);

		expect(sendPushNotification).toHaveBeenCalledTimes(2);
		expect(retry).toHaveBeenCalledOnce();
		expect(ack).not.toHaveBeenCalled();
	});
});
