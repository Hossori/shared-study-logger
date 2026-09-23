import { describe, expect, it } from "vitest";
import {
	SELECTED_GROUP_STORAGE_KEY,
	parseQueryGroupId,
	persistSelectedGroupId,
	readStoredSelectedGroupId,
	resolveSelectedGroupId,
} from "../../src/react-app/features/groups/selectedGroup";

function createMemoryStorage(initial: Record<string, string> = {}) {
	const data = { ...initial };
	return {
		getItem(key: string) {
			return data[key] ?? null;
		},
		setItem(key: string, value: string) {
			data[key] = value;
		},
		removeItem(key: string) {
			delete data[key];
		},
		data,
	};
}

describe("selectedGroup", () => {
	const membershipIds = ["group-a", "group-b", "group-c"];

	it("parseQueryGroupId treats missing and empty as null", () => {
		expect(parseQueryGroupId(null)).toBeNull();
		expect(parseQueryGroupId("")).toBeNull();
		expect(parseQueryGroupId("group-a")).toBe("group-a");
	});

	it("resolveSelectedGroupId prefers URL over storage and membership", () => {
		expect(
			resolveSelectedGroupId(membershipIds, "group-b", "group-c"),
		).toBe("group-b");
	});

	it("resolveSelectedGroupId uses storage when URL is absent", () => {
		expect(resolveSelectedGroupId(membershipIds, null, "group-c")).toBe(
			"group-c",
		);
	});

	it("resolveSelectedGroupId uses first membership when URL and storage are absent", () => {
		expect(resolveSelectedGroupId(membershipIds, null, null)).toBe("group-a");
	});

	it("resolveSelectedGroupId falls through invalid URL to valid storage", () => {
		expect(
			resolveSelectedGroupId(membershipIds, "unknown", "group-b"),
		).toBe("group-b");
	});

	it("resolveSelectedGroupId falls through invalid URL and storage to first membership", () => {
		expect(
			resolveSelectedGroupId(membershipIds, "unknown", "also-unknown"),
		).toBe("group-a");
	});

	it("resolveSelectedGroupId returns null when membership is empty", () => {
		expect(resolveSelectedGroupId([], "group-a", "group-b")).toBeNull();
		expect(resolveSelectedGroupId([], null, null)).toBeNull();
	});

	it("readStoredSelectedGroupId returns null when unset or empty", () => {
		expect(readStoredSelectedGroupId(createMemoryStorage())).toBeNull();
		expect(
			readStoredSelectedGroupId(
				createMemoryStorage({ [SELECTED_GROUP_STORAGE_KEY]: "" }),
			),
		).toBeNull();
		expect(
			readStoredSelectedGroupId(
				createMemoryStorage({ [SELECTED_GROUP_STORAGE_KEY]: "group-a" }),
			),
		).toBe("group-a");
	});

	it("persistSelectedGroupId writes and removes the storage key", () => {
		const storage = createMemoryStorage();
		persistSelectedGroupId("group-b", storage);
		expect(storage.data[SELECTED_GROUP_STORAGE_KEY]).toBe("group-b");
		persistSelectedGroupId(null, storage);
		expect(storage.data[SELECTED_GROUP_STORAGE_KEY]).toBeUndefined();
	});
});
