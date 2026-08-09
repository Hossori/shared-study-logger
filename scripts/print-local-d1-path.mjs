import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d1Dir = path.join(
	root,
	'.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
);

if (!fs.existsSync(d1Dir)) {
	console.error(
		'Local D1 directory not found. Run migrations first:\n' +
			'  pnpm exec wrangler d1 migrations apply shared-study-logger-db --local',
	);
	process.exit(1);
}

const candidates = fs
	.readdirSync(d1Dir)
	.filter((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
	.map((name) => {
		const fullPath = path.join(d1Dir, name);
		return { name, fullPath, size: fs.statSync(fullPath).size };
	})
	.sort((a, b) => b.size - a.size);

if (candidates.length === 0) {
	console.error('No local D1 SQLite file found in', d1Dir);
	process.exit(1);
}

const db = candidates[0];
const relativePath = path
	.relative(root, db.fullPath)
	.split(path.sep)
	.join('/');

console.log(relativePath);
console.error(`# absolute: ${db.fullPath}`);
console.error(`# size: ${db.size} bytes`);
