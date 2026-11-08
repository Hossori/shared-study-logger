import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readInfoVersion(yaml) {
  const infoBlock = yaml.split(/^paths:/m)[0];
  const match = infoBlock.match(/^\s*version:\s*["']?([^"'\s]+)["']?\s*$/m);
  return match?.[1] ?? null;
}

function readHeaderPattern(yaml) {
  const match = yaml.match(
    /ClientApiVersion:[\s\S]*?pattern:\s*'([^']+)'/,
  );
  return match?.[1] ?? null;
}

function readExportedString(source, name) {
  const match = source.match(
    new RegExp(`export const ${name} =\\s*"([^"]+)"`),
  );
  return match?.[1]?.replace(/\\\\/g, "\\") ?? null;
}

export function clientApiVersionMismatch() {
  const yaml = readFileSync(join(root, "openapi/api.yaml"), "utf8");
  const source = readFileSync(
    join(root, "shared/client-api-version.ts"),
    "utf8",
  );
  const problems = [];

  const specVersion = readInfoVersion(yaml);
  const clientVersion = readExportedString(source, "CLIENT_API_VERSION");
  if (specVersion !== clientVersion) {
    problems.push(
      `openapi info.version (${specVersion}) !== CLIENT_API_VERSION (${clientVersion})`,
    );
  }

  const specPattern = readHeaderPattern(yaml);
  const clientPattern = readExportedString(
    source,
    "CLIENT_API_VERSION_PATTERN_SOURCE",
  );
  if (specPattern !== clientPattern) {
    problems.push(
      `openapi X-Client-Api-Version pattern (${specPattern}) !== CLIENT_API_VERSION_PATTERN_SOURCE (${clientPattern})`,
    );
  }

  return problems;
}
