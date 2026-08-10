#!/usr/bin/env node
/**
 * 初期ユーザー・グループ・学習記録投入用シードスクリプト。
 *
 * このアプリは固定アカウント方式（自己登録なし、管理者が事前にユーザーをDBに登録する）を
 * 採用しているため、サンプルの管理者ユーザー・サンプルグループ3件・
 * グループメンバーシップ・学習記録（2つ目のグループに61件）を投入する。
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

const SAMPLE_ADMIN = {
	email: "admin@example.com",
	password: "ChangeMe123!",
	displayName: "管理者",
};

/** @type {{ name: string, recordCount: number }[]} */
const SAMPLE_GROUPS = [
	{ name: "サンプル学習グループ", recordCount: 0 },
	{ name: "テストグループ2", recordCount: 61 },
	{ name: "テストグループ3", recordCount: 0 },
];

/** 再実行しても同じ行を指す固定ID（INSERT OR IGNORE と組み合わせて冪等にする） */
const SEED_USER_ID = "00000000-0000-4000-a000-000000000001";
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
 * @param {string} userId
 * @param {number} count
 * @returns {string[]}
 */
function buildStudyRecordStatements(groupId, userId, count) {
	const dayMs = 24 * 60 * 60 * 1000;
	const statements = [];

	for (let i = 1; i <= count; i++) {
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
	const salt = generateSaltHex();
	const passwordHash = await hashPassword(SAMPLE_ADMIN.password, salt);

	const statements = [
		`INSERT OR IGNORE INTO users (id, email, password_hash, password_salt, display_name, created_at) VALUES ('${SEED_USER_ID}', '${sqlEscape(SAMPLE_ADMIN.email)}', '${passwordHash}', '${salt}', '${sqlEscape(SAMPLE_ADMIN.displayName)}', '${now}');`,
		...SAMPLE_GROUPS.flatMap((group, i) => {
			const groupId = SEED_GROUP_IDS[i];
			return [
				`INSERT OR IGNORE INTO groups (id, name, created_at) VALUES ('${groupId}', '${sqlEscape(group.name)}', '${now}');`,
				`INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES ('${groupId}', '${SEED_USER_ID}', '${now}');`,
				...buildStudyRecordStatements(
					groupId,
					SEED_USER_ID,
					group.recordCount,
				),
			];
		}),
	];

	return { sql: statements.join("\n"), userId: SEED_USER_ID, groupIds: SEED_GROUP_IDS };
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
		rmSync(d1StatePath, { recursive: true, force: true });
		console.log(`# ローカルD1をリセットしました: ${d1StatePath}`);
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

	return buildSeedSql().then(({ sql, userId, groupIds }) => {
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
		console.log(`\n# サンプル管理者ユーザー: ${SAMPLE_ADMIN.email} / ${SAMPLE_ADMIN.password}`);
		console.log(`# user.id = ${userId}`);
		groupIds.forEach((id, i) => {
			const group = SAMPLE_GROUPS[i];
			console.log(
				`# group[${i}].id = ${id} (${group.name}, records=${group.recordCount})`,
			);
		});

		if (skipExecute) {
			console.log(
				"\n--sql-only が指定されたため wrangler d1 execute の自動実行はスキップしました。",
			);
			console.log(
				`手動で実行する場合: npx wrangler d1 execute ${DB_NAME} ${remote ? "--remote" : "--local"} --file=${outputPath}`,
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
				`\n# wrangler d1 execute ${DB_NAME} ${target} --file=${outputPath} を実行します...`,
			);
			runWrangler(wranglerBin, projectRoot, [
				"d1",
				"execute",
				DB_NAME,
				target,
				`--file=${outputPath}`,
			]);
			console.log("\n✅ シード投入が完了しました。");
		} catch {
			console.error(
				"\n⚠️ wrangler d1 execute の自動実行に失敗しました（未ログイン等の場合はここでエラーになります）。",
			);
			console.error(
				`手動で実行してください: npx wrangler d1 execute ${DB_NAME} ${target} --file=${outputPath}`,
			);
			process.exitCode = 1;
		}
	});
}

main();
