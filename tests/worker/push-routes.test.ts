import { beforeEach, describe, expect, it } from "vitest";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("push routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("rejects non-https push subscription endpoints", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const response = await workerFetch(
			new Request("http://example.com/api/push/subscribe", {
				method: "POST",
				headers: {
					cookie,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					endpoint: "http://push.example.test/subscribe",
					keys: { p256dh: "key", auth: "auth" },
				}),
			}),
		);

		expect(response.status).toBe(400);
		const body = (await response.json()) as { error: string };
		expect(body.error).toBe("invalid_request");
	});
});
