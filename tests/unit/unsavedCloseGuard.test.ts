import { describe, expect, it } from "vitest";
import { resolveUnsavedCloseRequest } from "../../src/react-app/lib/unsavedCloseGuard";

describe("resolveUnsavedCloseRequest", () => {
	it("closes immediately when nothing was edited", () => {
		expect(
			resolveUnsavedCloseRequest({ dirty: false, confirming: false }),
		).toBe("close");
	});

	it("prompts when any value was edited", () => {
		expect(
			resolveUnsavedCloseRequest({ dirty: true, confirming: false }),
		).toBe("confirm");
	});

	it("ignores re-entry while the confirm dialog is open", () => {
		expect(
			resolveUnsavedCloseRequest({ dirty: true, confirming: true }),
		).toBe("ignore");
		expect(
			resolveUnsavedCloseRequest({ dirty: false, confirming: true }),
		).toBe("ignore");
	});
});
