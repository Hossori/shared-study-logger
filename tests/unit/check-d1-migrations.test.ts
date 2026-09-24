/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	checkMigrationFile,
	isHistoricalUnsafeException,
} from "../../scripts/check-d1-migrations.mjs";

const migrationsDir = join(process.cwd(), "migrations");

describe("isHistoricalUnsafeException", () => {
	it("matches 0009–0012 only", () => {
		expect(isHistoricalUnsafeException("0009_foo.sql")).toBe(true);
		expect(isHistoricalUnsafeException("0012_bar.sql")).toBe(true);
		expect(isHistoricalUnsafeException("0008_foo.sql")).toBe(false);
		expect(isHistoricalUnsafeException("0013_foo.sql")).toBe(false);
	});
});

describe("checkMigrationFile on real migrations", () => {
	it("0009–0012 are historical exceptions", () => {
		for (const prefix of ["0009", "0010", "0011", "0012"]) {
			const file = readdirSync(migrationsDir).find((name) =>
				name.startsWith(`${prefix}_`),
			);
			expect(file).toBeDefined();
			const sql = readFileSync(join(migrationsDir, file!), "utf8");
			expect(checkMigrationFile(file!, sql).ok).toBe(true);
		}
	});

	it("0007 and 0008 pass (no unsafe parent DROP)", () => {
		for (const prefix of ["0007", "0008"]) {
			const file = readdirSync(migrationsDir).find((name) =>
				name.startsWith(`${prefix}_`),
			);
			expect(file).toBeDefined();
			const sql = readFileSync(join(migrationsDir, file!), "utf8");
			expect(checkMigrationFile(file!, sql)).toEqual({ ok: true, errors: [] });
		}
	});
});

describe("checkMigrationFile synthetic", () => {
	it("fails DROP study_records without record_reactions detach", () => {
		const sql = `
PRAGMA foreign_keys=OFF;
CREATE TABLE study_records_new (
  id TEXT PRIMARY KEY
);
INSERT INTO study_records_new SELECT id FROM study_records;
DROP TABLE study_records;
`;
		const result = checkMigrationFile("9999_bad.sql", sql);
		expect(result.ok).toBe(false);
		expect(result.errors.some((e: string) => e.includes("record_reactions"))).toBe(
			true,
		);
	});

	it("passes detach rebuild before DROP study_records", () => {
		const sql = `
CREATE TABLE record_reactions_new (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES study_records (id),
  user_id TEXT NOT NULL REFERENCES users (id)
);
INSERT INTO record_reactions_new SELECT id, record_id, user_id FROM record_reactions;
DROP TABLE record_reactions;
ALTER TABLE record_reactions_new RENAME TO record_reactions;
DROP TABLE study_records;
`;
		expect(checkMigrationFile("9999_good.sql", sql).ok).toBe(true);
	});

	it("fails DROP users without detaching all children", () => {
		const sql = `
INSERT INTO group_members_backup SELECT group_id, user_id, joined_at FROM group_members;
DROP TABLE users;
`;
		const result = checkMigrationFile("9999_bad_users.sql", sql);
		expect(result.ok).toBe(false);
		expect(result.errors.length).toBeGreaterThan(1);
	});

	it("passes backup-table copy before DROP study_records", () => {
		const sql = `
INSERT INTO record_reactions_backup SELECT * FROM record_reactions;
DROP TABLE study_records;
`;
		expect(checkMigrationFile("9999_backup.sql", sql).ok).toBe(true);
	});
});

describe("CLI", () => {
	it("exits 0 on real migrations/", () => {
		const result = spawnSync("node", ["scripts/check-d1-migrations.mjs"], {
			cwd: process.cwd(),
			encoding: "utf8",
		});
		expect(result.status).toBe(0);
	});
});
