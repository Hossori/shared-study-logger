/**
 * wrangler d1 execute --json の出力から行オブジェクトを取り出す。
 * ログ接頭辞や success=false を扱い、CI の行数カナリアから使う。
 */
import { stdin } from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {string} raw
 * @returns {unknown}
 */
export function extractJsonValue(raw) {
  const start = raw.search(/[\[{]/);
  if (start < 0) {
    throw new Error("No JSON object/array in wrangler output");
  }
  const slice = raw.slice(start);
  try {
    return JSON.parse(slice);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const positionMatch = message.match(/position (\d+)/i);
    if (positionMatch) {
      return JSON.parse(slice.slice(0, Number(positionMatch[1])));
    }
    throw error;
  }
}

/**
 * @param {unknown} parsed
 * @returns {Record<string, unknown>[]}
 */
export function rowsFromD1ExecuteJson(parsed) {
  const batches = Array.isArray(parsed) ? parsed : [parsed];
  /** @type {Record<string, unknown>[]} */
  const rows = [];

  for (const batch of batches) {
    if (batch && typeof batch === "object" && "success" in batch) {
      if (batch.success === false) {
        throw new Error("wrangler d1 execute reported success=false");
      }
      if (Array.isArray(batch.results)) {
        for (const row of batch.results) {
          if (row && typeof row === "object") {
            rows.push(/** @type {Record<string, unknown>} */ (row));
          }
        }
        continue;
      }
    }

    if (batch && typeof batch === "object" && !Array.isArray(batch)) {
      rows.push(/** @type {Record<string, unknown>} */ (batch));
    }
  }

  return rows;
}

/**
 * @param {string} raw
 * @returns {Record<string, unknown>[]}
 */
export function parseWranglerD1ExecuteJson(raw) {
  return rowsFromD1ExecuteJson(extractJsonValue(raw));
}

function runCli() {
  const chunks = [];
  stdin.setEncoding("utf8");
  stdin.on("data", (chunk) => {
    chunks.push(chunk);
  });
  stdin.on("end", () => {
    try {
      const rows = parseWranglerD1ExecuteJson(chunks.join(""));
      process.stdout.write(`${JSON.stringify(rows)}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exit(1);
    }
  });
}

const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === scriptPath) {
  runCli();
}
