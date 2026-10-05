import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedPath = join(root, "shared/generated/api.zod.ts");

let before;
try {
  before = readFileSync(generatedPath);
} catch {
  console.error("shared/generated/api.zod.ts not found");
  process.exit(1);
}

execSync("pnpm exec orval --config orval.config.ts", {
  cwd: root,
  stdio: "inherit",
});
execSync(`pnpm exec prettier --write "${generatedPath}"`, {
  cwd: root,
  stdio: "inherit",
});

const after = readFileSync(generatedPath);
if (!after.equals(before)) {
  writeFileSync(generatedPath, before);
  console.error(
    "openapi:check failed: regenerated api.zod.ts differs from committed content",
  );
  process.exit(1);
}

console.log("openapi:check passed");
