export function extractJsonValue(raw: string): unknown;

export function rowsFromD1ExecuteJson(
	parsed: unknown,
): Record<string, unknown>[];

export function parseWranglerD1ExecuteJson(
	raw: string,
): Record<string, unknown>[];
