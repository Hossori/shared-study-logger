/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { parseWranglerD1ExecuteJson } from "../../scripts/parse-wrangler-d1-json.mjs";

const wrapped = (rows: unknown[], success = true) =>
	JSON.stringify([{ results: rows, success }]);

describe("parseWranglerD1ExecuteJson", () => {
	it("reads rows from wrangler array wrapper", () => {
		expect(parseWranglerD1ExecuteJson(wrapped([{ count: 42 }]))).toEqual([
			{ count: 42 },
		]);
	});

	it("strips log prefix before JSON", () => {
		const raw = `🌀 Executing on remote database shared-study-logger-db (de455ad0):\n${wrapped([{ name: "users" }])}`;
		expect(parseWranglerD1ExecuteJson(raw)).toEqual([{ name: "users" }]);
	});

	it("flattens two rows in one results array", () => {
		expect(
			parseWranglerD1ExecuteJson(wrapped([{ id: 1 }, { id: 2 }])),
		).toEqual([{ id: 1 }, { id: 2 }]);
	});

	it("flattens multiple statement batches without merging row objects", () => {
		const raw = JSON.stringify([
			{ results: [{ count: 1 }], success: true },
			{ results: [{ count: 2 }], success: true },
		]);
		expect(parseWranglerD1ExecuteJson(raw)).toEqual([
			{ count: 1 },
			{ count: 2 },
		]);
	});

	it("parses object wrapper with results", () => {
		const raw = JSON.stringify({
			results: [{ count: 3 }],
			success: true,
		});
		expect(parseWranglerD1ExecuteJson(raw)).toEqual([{ count: 3 }]);
	});

	it("throws when success is false", () => {
		expect(() =>
			parseWranglerD1ExecuteJson(wrapped([], false)),
		).toThrow(/success=false/);
	});

	it("throws when output has no JSON", () => {
		expect(() => parseWranglerD1ExecuteJson("no json here")).toThrow(
			/No JSON/,
		);
	});
});

describe("parse-wrangler-d1-json CLI", () => {
	it("prints row array on stdout", () => {
		const result = spawnSync("node", ["scripts/parse-wrangler-d1-json.mjs"], {
			cwd: process.cwd(),
			encoding: "utf8",
			input: wrapped([{ count: 7 }]),
		});
		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toEqual([{ count: 7 }]);
	});
});
