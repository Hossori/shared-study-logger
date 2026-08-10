#!/usr/bin/env node
/**
 * 初期ユーザー・グループ・学習記録投入用シードスクリプト。
 *
 * このアプリは固定アカウント方式（自己登録なし、管理者が事前にユーザーをDBに登録する）を
 * 採用しているため、サンプルユーザー2名（管理者・テストユーザー）・サンプルグループ3件・
 * グループメンバーシップ・学習記録（2つ目のグループに61件: 偶数indexはテストユーザー投稿、
 * 奇数indexは管理者投稿 → test=30 / admin=31）を投入する。
 *
 * パスワードはWeb CryptoのPBKDF2（SHA-256, 100,000 iterations, 32byte導出）で
 * ハッシュ化する。これは `src/worker/lib/auth.ts`（backend-auth）で実装される
 * ログイン検証ロジックと同一アルゴリズムを使う想定。
 *
 * 使い方:
 *   node scripts/seed-users.mjs            # ローカルD1(--local)に投入（重複は無視）
 *   node scripts/seed-users.mjs --reset    # ローカルD1を削除してからマイグレーション→投入
 *   node scripts/seed-users.mjs --remote   # 本番D1(--remote)に投入
 *
 * 生成したSQLは `scripts/.seed-output.sql` にも書き出すので、
 * `wrangler d1 execute` が使えない環境では手動実行することもできる。
 */
import { webcrypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DB_NAME = "shared-study-logger-db";
const PBKDF2_ITERATIONS = 100_000;

/** @type {{ id: string, email: string, password: string, displayName: string }[]} */
const SAMPLE_USERS = [
	{
		id: "00000000-0000-4000-a000-000000000001",
		email: "admin@example.com",
		password: "ChangeMe123!",
		displayName: "管理者",
	},
	{
		id: "00000000-0000-4000-a000-000000000005",
		email: "test@example.com",
		password: "ChangeMe123!",
		displayName: "テストユーザー",
	},
];

/** 学習記録の投稿者（管理者 / テストユーザー） */
const SEED_ADMIN_USER_ID = SAMPLE_USERS[0].id;
const SEED_TEST_USER_ID = SAMPLE_USERS[1].id;

/**
 * 学習記録の投稿者を index（1始まり）から決定する。
 * 偶数 index → テストユーザー、奇数 index → 管理者（61件なら test=30 / admin=31）。
 * @param {number} index
 * @returns {string}
 */
function resolveRecordAuthorId(index) {
	return index % 2 === 0 ? SEED_TEST_USER_ID : SEED_ADMIN_USER_ID;
}

/** @type {{ name: string, recordCount: number }[]} */
const SAMPLE_GROUPS = [
	{ name: "サンプル学習グループ", recordCount: 0 },
	{ name: "テストグループ2", recordCount: 61 },
	{ name: "テストグループ3", recordCount: 0 },
];

/** 再実行しても同じ行を指す固定ID（INSERT OR IGNORE と組み合わせて冪等にする） */
const SEED_GROUP_IDS = [
	"00000000-0000-4000-a000-000000000002",
	"00000000-0000-4000-a000-000000000003",
	"00000000-0000-4000-a000-000000000004",
];

/** 学習記録の勉強日時の基準（新しい順に1日ずつ遡る） */
const SEED_RECORDS_BASE_DATETIME = Date.parse("2026-08-01T12:00:00.000Z");

/** @returns {string} 16byteのランダムsalt(hex文字列) */
function generateSaltHex() {
	const bytes = webcrypto.getRandomValues(new Uint8Array(16));
	return Buffer.from(bytes).toString("hex");
}

/**
 * PBKDF2(SHA-256)でパスワードをハッシュ化する。
 * `src/worker/lib/auth.ts` の検証ロジックと合わせること。
 * @param {string} password
 * @param {string} saltHex
 * @returns {Promise<string>} 導出鍵のhex文字列(32byte)
 */
async function hashPassword(password, saltHex) {
	const salt = Buffer.from(saltHex, "hex");
	const keyMaterial = await webcrypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derivedBits = await webcrypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);
	return Buffer.from(derivedBits).toString("hex");
}

/** SQL文字列リテラル用にシングルクォートをエスケープする */
function sqlEscape(value) {
	return value.replace(/'/g, "''");
}

/**
 * シード学習記録の固定UUID（1始まり）。
 * @param {number} index
 * @returns {string}
 */
function seedRecordId(index) {
	return `00000000-0000-4000-b000-${String(index).padStart(12, "0")}`;
}

/**
 * @param {string} groupId
 * @param {number} count
 * @param {(index: number) => string} resolveUserId index（1始まり）→投稿者 user_id
 * @returns {string[]}
 */
function buildStudyRecordStatements(groupId, count, resolveUserId) {
	const dayMs = 24 * 60 * 60 * 1000;
	const statements = [];

	for (let i = 1; i <= count; i++) {
		const userId = resolveUserId(i);
		const studyDatetime = new Date(
			SEED_RECORDS_BASE_DATETIME - (i - 1) * dayMs,
		).toISOString();
		const createdAt = studyDatetime;
		const title = `サンプル学習記録 ${i}`;
		const memo =
			i % 3 === 0 ? `シード用メモ ${i}` : null;
		const memoSql = memo === null ? "NULL" : `'${sqlEscape(memo)}'`;

		statements.push(
			`INSERT OR IGNORE INTO study_records (id, group_id, user_id, study_datetime, title, memo, created_at, updated_at) VALUES ('${seedRecordId(i)}', '${groupId}', '${userId}', '${studyDatetime}', '${sqlEscape(title)}', ${memoSql}, '${createdAt}', '${createdAt}');`,
		);
	}

	return statements;
}

async function buildSeedSql() {
	const now = new Date().toISOString();

	const userStatements = await Promise.all(
		SAMPLE_USERS.map(async (user) => {
			const salt = generateSaltHex();
			const passwordHash = await hashPassword(user.password, salt);
			return `INSERT OR IGNORE INTO users (id, email, password_hash, password_salt, display_name, created_at) VALUES ('${user.id}', '${sqlEscape(user.email)}', '${passwordHash}', '${salt}', '${sqlEscape(user.displayName)}', '${now}');`;
		}),
	);

	const statements = [
		...userStatements,
		...SAMPLE_GROUPS.flatMap((group, i) => {
			const groupId = SEED_GROUP_IDS[i];
			return [
				`INSERT OR IGNORE INTO groups (id, name, created_at) VALUES ('${groupId}', '${sqlEscape(group.name)}', '${now}');`,
				...SAMPLE_USERS.map(
					(user) =>
						`INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES ('${groupId}', '${user.id}', '${now}');`,
				),
				...buildStudyRecordStatements(
					groupId,
					group.recordCount,
					resolveRecordAuthorId,
				),
			];
		}),
	];

	return {
		sql: statements.join("\n"),
		users: SAMPLE_USERS,
		groupIds: SEED_GROUP_IDS,
	};
}

function runWrangler(wranglerBin, projectRoot, args) {
	execFileSync(process.execPath, [wranglerBin, ...args], {
		stdio: "inherit",
		cwd: projectRoot,
	});
}

function resetLocalDb(projectRoot) {
	const d1StatePath = path.join(projectRoot, ".wrangler", "state", "v3", "d1");
	if (existsSync(d1StatePath)) {
		try {
			rmSync(d1StatePath, { recursive: true, force: true });
			console.log(`# ローカルD1をリセットしました: ${d1StatePath}`);
		} catch (error) {
			const detail =
				error instanceof Error ? error.message : String(error);
			const wrapped = new Error(
				`ローカルD1の削除に失敗しました: ${detail}\n` +
					`D1の sqlite ファイルがロックされている可能性があります。` +
					` pnpm dev を停止してから再実行してください。`,
			);
			wrapped.cause = error;
			throw wrapped;
		}
	} else {
		console.log("# ローカルD1は未作成のためリセットはスキップしました。");
	}
}

function main() {
	const args = process.argv.slice(2);
	const remote = args.includes("--remote");
	const skipExecute = args.includes("--sql-only");
	const reset = args.includes("--reset");

	if (reset && remote) {
		console.error("❌ --reset はローカル専用です。--remote と併用できません。");
		process.exitCode = 1;
		return;
	}

	return buildSeedSql().then(({ sql, users, groupIds }) => {
		const projectRoot = path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			"..",
		);
		const wranglerBin = path.join(
			projectRoot,
			"node_modules",
			"wrangler",
			"bin",
			"wrangler.js",
		);
		const outputPath = path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			".seed-output.sql",
		);
		writeFileSync(outputPath, sql + "\n", "utf8");

		console.log("# 生成したSQL:");
		console.log(sql);
		console.log(`\n# ${outputPath} に書き出しました。`);
		users.forEach((user, i) => {
			console.log(
				`# サンプルユーザー[${i}]: ${user.email} / ${user.password} (${user.displayName})`,
			);
			console.log(`# user[${i}].id = ${user.id}`);
		});
		groupIds.forEach((id, i) => {
			const group = SAMPLE_GROUPS[i];
			if (group.recordCount === 0) {
				console.log(
					`# group[${i}].id = ${id} (${group.name}, records=0)`,
				);
				return;
			}
			let testAuthorCount = 0;
			let adminAuthorCount = 0;
			for (let r = 1; r <= group.recordCount; r++) {
				if (resolveRecordAuthorId(r) === SEED_TEST_USER_ID) {
					testAuthorCount += 1;
				} else {
					adminAuthorCount += 1;
				}
			}
			console.log(
				`# group[${i}].id = ${id} (${group.name}, records=${group.recordCount}: test=${testAuthorCount}, admin=${adminAuthorCount})`,
			);
		});

		if (skipExecute) {
			console.log(
				"\n--sql-only が指定されたため wrangler d1 execute の自動実行はスキップしました。",
			);
			console.log(
				`手動で実行する場合: npx wrangler d1 execute ${DB_NAME} ${remote ? "--remote" : "--local"} --file=${outputPath} --yes`,
			);
			return;
		}

		const target = remote ? "--remote" : "--local";
		try {
			if (reset) {
				resetLocalDb(projectRoot);
				console.log(
					`\n# wrangler d1 migrations apply ${DB_NAME} --local を実行します...`,
				);
				runWrangler(wranglerBin, projectRoot, [
					"d1",
					"migrations",
					"apply",
					DB_NAME,
					"--local",
				]);
			}

			console.log(
				`\n# wrangler d1 execute ${DB_NAME} ${target} --file=${outputPath} --yes を実行します...`,
			);
			runWrangler(wranglerBin, projectRoot, [
				"d1",
				"execute",
				DB_NAME,
				target,
				`--file=${outputPath}`,
				"--yes",
			]);
			console.log("\n✅ シード投入が完了しました。");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			console.error(
				"\n⚠️ シード投入の自動実行に失敗しました（ローカルD1の削除失敗・ファイルロック、マイグレーション/execute の失敗、未ログインなどが考えられます）。",
			);
			console.error(`原因: ${message}`);
			console.error(
				`手動で実行する場合: npx wrangler d1 execute ${DB_NAME} ${target} --file=${outputPath} --yes`,
			);
			process.exitCode = 1;
		}
	});
}

main();
