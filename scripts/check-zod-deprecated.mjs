/**
 * Zod v4 で非推奨の `z.string().<format>()` インスタンスメソッドが
 * `src/` および `shared/` に残っていないか検査する。
 *
 * 代替: `z.email()`, `z.url()`, `z.iso.datetime()` 等のトップレベル関数。
 * 詳細は `.cursor/skills/shared-study-logger-overview/reference/code-quality.md` §2。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DEPRECATED_ZOD_STRING_METHOD =
  /z\.string\(\)\.(email|url|jwt|emoji|guid|uuid|uuidv4|uuidv6|uuidv7|nanoid|cuid|cuid2|ulid|base64|base64url|xid|ksuid|ipv4|ipv6|cidrv4|datetime|date|time)\(/g;

const SCAN_ROOTS = ["src", "shared"];

function collectTypeScriptFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      collectTypeScriptFiles(path, files);
      continue;
    }
    if (/\.tsx?$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}

let hasViolation = false;

for (const root of SCAN_ROOTS) {
  for (const file of collectTypeScriptFiles(root)) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(DEPRECATED_ZOD_STRING_METHOD)) {
      const line = content.slice(0, match.index).split("\n").length;
      console.error(
        `${file}:${line}: deprecated Zod string format method "${match[0]}"`,
      );
      hasViolation = true;
    }
  }
}

if (hasViolation) {
  console.error(
    "\nUse top-level Zod format functions instead (e.g. z.iso.datetime(), z.email()).",
  );
  process.exit(1);
}

console.log("No deprecated Zod string format methods found.");
