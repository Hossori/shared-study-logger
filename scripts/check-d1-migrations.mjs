/**
 * D1 migration 静的検査: ON DELETE CASCADE 親テーブルの DROP 前に
 * 子テーブルの Detach / Backup が行われているか確認する。
 *
 * 0009–0012 は本番適用済み・このパターンをコピー禁止.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {Record<string, string[]>} */
const CASCADE_GRAPH = {
	study_records: ["record_reactions"],
	users: [
		"group_members",
		"study_records",
		"record_reactions",
		"push_subscriptions",
	],
	groups: ["group_members", "study_records"],
};

const PARENT_TABLES = new Set(Object.keys(CASCADE_GRAPH));

const DROP_TABLE_REGEX =
	/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:["'`](\w+)["'`]|(\w+))/gi;

const BACKUP_NAME_PATTERN = /backup|_bak|__detach|_detach|detach_/i;

const CREATE_TABLE_REGEX =
	/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["'`](\w+)["'`]|(\w+))[\s\S]*?;/gi;

/**
 * @param {string} fileName
 * @returns {boolean}
 */
export function isHistoricalUnsafeException(fileName) {
	const base = fileName.replace(/^.*[/\\]/, "");
	return /^(0009_|0010_|0011_|0012_)/.test(base);
}

/**
 * @param {string} sql
 * @param {string} tableName
 * @returns {string | null}
 */
function findCreateTableDdl(sql, tableName) {
	const regex = new RegExp(CREATE_TABLE_REGEX.source, CREATE_TABLE_REGEX.flags);
	const target = tableName.toLowerCase();
	let match;
	while ((match = regex.exec(sql)) !== null) {
		const name = (match[1] || match[2]).toLowerCase();
		if (name === target) {
			return match[0];
		}
	}
	return null;
}

/**
 * @param {string} beforeText
 * @param {string} child
 * @returns {boolean}
 */
function isChildProtected(beforeText, child) {
	const insertRegex = new RegExp(
		`INSERT\\s+INTO\\s+(?:["'\`](\\w+)["'\`]|(\\w+))(?:\\s*\\([^)]*\\))?[\\s\\S]*?\\bFROM\\s+\\b${child}\\b`,
		"gi",
	);
	let insertMatch;
	while ((insertMatch = insertRegex.exec(beforeText)) !== null) {
		const dest = (insertMatch[1] || insertMatch[2]).toLowerCase();
		if (BACKUP_NAME_PATTERN.test(dest)) {
			return true;
		}
		const ddl = findCreateTableDdl(beforeText, dest);
		if (ddl && !/ON\s+DELETE\s+CASCADE/i.test(ddl)) {
			return true;
		}
	}
	return false;
}

/**
 * @param {string} fileName
 * @param {string} sql
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function checkMigrationFile(fileName, sql) {
	if (isHistoricalUnsafeException(fileName)) {
		return { ok: true, errors: [] };
	}

	const errors = [];
	const dropRegex = new RegExp(DROP_TABLE_REGEX.source, DROP_TABLE_REGEX.flags);
	let match;
	while ((match = dropRegex.exec(sql)) !== null) {
		const tableName = (match[1] || match[2]).toLowerCase();
		if (!PARENT_TABLES.has(tableName)) {
			continue;
		}

		const beforeText = sql.slice(0, match.index);
		for (const child of CASCADE_GRAPH[tableName]) {
			if (!isChildProtected(beforeText, child)) {
				errors.push(
					`${fileName}: DROP TABLE ${tableName} without safe detach/copy for CASCADE child ${child}`,
				);
			}
		}
	}

	return { ok: errors.length === 0, errors };
}

function runCli() {
	const migrationsDir = join(
		dirname(fileURLToPath(import.meta.url)),
		"..",
		"migrations",
	);
	const files = readdirSync(migrationsDir)
		.filter((file) => file.endsWith(".sql"))
		.sort();

	let hasViolation = false;
	for (const file of files) {
		const sql = readFileSync(join(migrationsDir, file), "utf8");
		const result = checkMigrationFile(file, sql);
		for (const error of result.errors) {
			console.error(error);
			hasViolation = true;
		}
	}

	if (hasViolation) {
		console.error(
			"\nUnsafe D1 migration: DROP CASCADE parent without child detach/copy. See docs/data-model.md.",
		);
		process.exit(1);
	}

	console.log(
		`D1 migration CASCADE/DROP safety check passed (${files.length} files).`,
	);
}

const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === scriptPath) {
	runCli();
}
