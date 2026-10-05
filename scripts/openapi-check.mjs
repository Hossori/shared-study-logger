import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedPaths = [
  join(root, "shared/generated/api.zod.ts"),
  join(root, "src/react-app/api/client.ts"),
];

const before = new Map();
for (const generatedPath of generatedPaths) {
  try {
    before.set(generatedPath, readFileSync(generatedPath));
  } catch {
    console.error(`${generatedPath} not found`);
    process.exit(1);
  }
}

execSync("pnpm exec orval --config orval.config.ts", {
  cwd: root,
  stdio: "inherit",
});
for (const generatedPath of generatedPaths) {
  execSync(`pnpm exec prettier --write "${generatedPath}"`, {
    cwd: root,
    stdio: "inherit",
  });
}

for (const generatedPath of generatedPaths) {
  const after = readFileSync(generatedPath);
  if (!after.equals(before.get(generatedPath))) {
    writeFileSync(generatedPath, before.get(generatedPath));
    console.error(
      `openapi:check failed: regenerated ${generatedPath} differs from committed content`,
    );
    process.exit(1);
  }
}

console.log("openapi:check passed");
