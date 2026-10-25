import 'dotenv/config';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import {
	PREVIEW_DIR,
	previewPath,
} from '../beatmaps/storage';
import {
	COVER_SUFFIX,
	bakeCover,
	coverName,
} from '../beatmaps/covers';
import { pool } from './client';

/**
 * Bakes the card cover of every stored background that has none yet (ingest bakes
 * new ones; sets stored before covers existed need this once). Safe to run again.
 *
 *   npm -w @oss-idle/server run bake:covers[:prod]
 */
const PARALLEL = 4;

const main = async (): Promise<void> => {
	const files = (await readdir(PREVIEW_DIR))
		.filter(f => /\.(jpe?g|png)$/i.test(f) && !f.endsWith(COVER_SUFFIX))
		.filter(f => !existsSync(previewPath(coverName(f))));
	let baked = 0;
	const worker = async () => {
		for (let file = files.pop(); file; file = files.pop()) if (await bakeCover(file)) baked++;
	};
	const total = files.length;
	await Promise.all(Array.from({ length: PARALLEL }, worker));
	console.log(`✓ baked ${baked} of ${total} covers`);
};

main()
	.catch(e => { console.error(e); process.exitCode = 1; })
	.finally(() => pool.end());
