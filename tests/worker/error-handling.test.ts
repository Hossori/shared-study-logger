import { afterEach, describe, expect, it, vi } from "vitest";
import * as db from "../../src/worker/lib/db";
import { workerFetch } from "./helpers";

describe("global error handler", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns JSON internal_error when a route throws unexpectedly", async () => {
		vi.spyOn(db, "getUserByEmail").mockRejectedValue(new Error("db unavailable"));

		const response = await workerFetch(
			new Request("http://example.com/api/auth/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					email: "nobody@example.com",
					password: "any-password",
				}),
			}),
		);

		expect(response.status).toBe(500);
		const body = (await response.json()) as { error: string };
		expect(body.error).toBe("internal_error");
	});
});
