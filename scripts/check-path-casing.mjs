/**
 * Windows はパスの大文字小文字を区別しない。
 * 同一ディレクトリで、拡張子を除いた名前の綴りが大文字小文字だけ違うファイルを失敗させる。
 *
 * TypeScript は `./LoginForm` を `LoginForm.ts` としても探す。
 * そのため `loginForm.ts` と `LoginForm.tsx` は Windows で衝突する。
 * フルパスを小文字化した一致だけでは、拡張子が違うこの組を見逃す。
 *
 * 綴りが完全に同じ組（`index.ts` と `index.tsx`）は対象外。
 * 解決順は Linux でも同じで、今回の Windows 固有の問題ではない。
 */
import { execFileSync } from "node:child_process";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {string} filePath
 * @returns {{ directory: string, stem: string }}
 */
export function pathStemKey(filePath) {
	const normalized = filePath.replaceAll("\\", "/");
	const directory = dirname(normalized).replaceAll("\\", "/");
	const stem = basename(normalized, extname(normalized));
	return { directory, stem };
}

/**
 * @param {readonly string[]} paths
 * @returns {string[][]} 衝突しているパスの組
 */
export function findStemCasingCollisions(paths) {
	/** @type {Map<string, string[]>} */
	const groups = new Map();

	for (const filePath of paths) {
		const { directory, stem } = pathStemKey(filePath);
		const key = `${directory.toLowerCase()}\0${stem.toLowerCase()}`;
		const group = groups.get(key);
		if (group) {
			group.push(filePath);
		} else {
			groups.set(key, [filePath]);
		}
	}

	/** @type {string[][]} */
	const collisions = [];
	for (const group of groups.values()) {
		if (group.length < 2) continue;
		const stems = new Set(group.map((filePath) => pathStemKey(filePath).stem));
		if (stems.size > 1) collisions.push([...group].sort());
	}
	return collisions;
}

/**
 * @param {readonly string[]} paths
 * @returns {string[]}
 */
export function formatStemCasingCollisions(paths) {
	return findStemCasingCollisions(paths).map(
		(group) =>
			`path casing: same directory has stems that differ only by case:\n  ${group.join("\n  ")}`,
	);
}

function trackedPaths() {
	const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
	return output.split("\0").filter((filePath) => filePath.length > 0);
}

function main() {
	const messages = formatStemCasingCollisions(trackedPaths());
	if (messages.length === 0) return;
	for (const message of messages) console.error(message);
	process.exit(1);
}

const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === scriptPath) main();
