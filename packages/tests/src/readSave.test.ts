import {
	afterEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

import { readSave } from '@oss-idle/shared/save';

/** An indexedDB whose open() fails with `name`, the way Chromium does: a missing database
 *  aborts its upgrade (AbortError), one it can't open fails outright (UnknownError). */
const failingOpen = (name: string) => ({
	open: () => {
		const req: { onerror?: () => void; error?: DOMException } = {};
		setTimeout(() => {
			req.error = new DOMException('', name);
			req.onerror?.();
		});
		return req;
	},
});

afterEach(() => void vi.unstubAllGlobals());

describe('readSave', () => {
	it('reads a missing database as no save', async () => {
		vi.stubGlobal('indexedDB', failingOpen('AbortError'));
		await expect(readSave('oss-idle')).resolves.toBeUndefined();
	});

	it('throws when the database cannot be opened, so no empty save replaces it', async () => {
		vi.stubGlobal('indexedDB', failingOpen('UnknownError'));
		await expect(readSave('oss-idle')).rejects.toThrow();
	});
});
