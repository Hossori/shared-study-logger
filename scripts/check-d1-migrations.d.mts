export function isHistoricalUnsafeException(fileName: string): boolean;

export function checkMigrationFile(
	fileName: string,
	sql: string,
): { ok: boolean; errors: string[] };
