import {
	expect,
	type Page,
} from '@playwright/test';
import { cleanOsz } from './files';
import type { Account } from './accounts';

/** `account`'s map up, or over their set `setId`, which the file names; `count` notes. */
export const upload = async (
	page: Page,
	account: Account,
	title: string,
	{ setId, count = 8 }: { setId?: number, count?: number } = {},
): Promise<number> => {
	const res = await page.request.post('/v1/beatmap/upload', {
		multipart: {
			file: {
				name: 'm.osz', mimeType: 'application/octet-stream',
				buffer: cleanOsz(title, {
					count, creator: account.name, setId, 
				}), 
			}, 
		},
	});
	expect(res.ok()).toBe(true);
	return (await res.json()).setId;
};

export const difficultyOf = async (page: Page, setId: number): Promise<number> =>
	(await (await page.request.get(`/v1/beatmap/set/${setId}`)).json()).diffs[0].id;
