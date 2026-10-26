import type { Page } from '@playwright/test';
import {
	strToU8,
	zipSync,
} from 'fflate';

import {
	type Account,
	query,
	testAccounts,
} from '../support/accounts';
import {
	cleanOsz,
	jpeg,
	silence,
} from '../support/files';
import {
	expect,
	test,
} from '../support/fixtures';
import Game from '../support/game';

/**
 * A player's own map going online as unranked: gated by the map checks, then
 * public, and theirs alone to update. Where an upload goes is the server's call,
 * from the ids and the Creator in its files.
 */

type Listed = { id: number, title: string, status: string };

/** The listing's unranked maps matching `title`. */
const unranked = async (page: Page, title: string): Promise<Listed[]> => {
	const q = encodeURIComponent(title);
	return (await page.request.get(`/v1/beatmap/all/desc?status=unranked&q=${q}`)).json();
};

/** `buffer` sent as an upload. */
const send = (page: Page, buffer: Buffer) => page.request.post('/v1/beatmap/upload', {
	multipart: {
		file: {
			name: 'm.osz', mimeType: 'application/octet-stream', buffer, 
		}, 
	}, 
});

const message = (page: Page, text: string | RegExp) =>
	page.locator('.message__contents:not(.closing)').filter({ hasText: text });

/** Give the open map an artist and 80 notes, enough to pass the checks, and upload it. */
const fillAndUpload = async (page: Page) => {
	await page.locator('.editor__tabs button', { hasText: 'Metadata' }).click();
	const artist = page.getByLabel('Artist', { exact: true });
	await artist.fill('e2e');
	await artist.press('Enter');
	for (let beat = 0; beat < 80; beat++) {
		await page.keyboard.press(String(beat % 4 + 1));
		for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
	}
	await page.getByRole('button', {
		name: 'Upload', exact: true, 
	}).click();
	await expect(message(page, 'Upload successful')).toBeVisible({ timeout: 30_000 });
};

test.describe('upload', () => {
	let grace: Account;
	let heidi: Account;

	test.beforeEach(async () => {
		[grace, heidi] = await testAccounts('editor');
	});

	test('a map goes up once its checks pass, then updates in place', async ({ playerAs }) => {
		const page = await playerAs(grace);
		const title = `Upload ${Date.now()}`;
		await new Game(page).newMap(`${title}.wav`, silence(40));

		// no notes and no artist yet: the checks hold it back
		await page.getByRole('button', {
			name: 'Upload', exact: true, 
		}).click();
		await expect(message(page, 'Fix the errors the map checks found first')).toBeVisible();

		await fillAndUpload(page);
		const [online] = await unranked(page, title);
		// its page opens on the site, over the editor
		const address = page.locator('.web.is-open .web__address');
		await expect(address).toHaveValue(new RegExp(`maps/${online.id}`));
		await page.locator('.web__close').click();
		expect(online.status).toBe('unranked');
		// catalog-shaped for the game's download link
		const set = await (await page.request.get(`/v1/beatmap/unranked/${online.id}`)).json();
		expect(set.versions).toHaveLength(1);

		// the web listing finds it among the unranked maps, and its page says so
		const web = await page.context().newPage();
		await web.goto(`/web/maps?status=unranked&q=${encodeURIComponent(title)}`);
		const card = web.locator('.list__beatmap', { hasText: title });
		await expect(card.locator('.list__beatmap_capsule')).toHaveText('Unranked');
		await card.click();
		await expect(web.locator('.mapset__status-badge')).toHaveText('unranked');
		await web.goto(`/web/maps?status=ranked&q=${encodeURIComponent(title)}`);
		await expect(web.locator('.list__beatmap', { hasText: title })).toHaveCount(0);

		// the upload belongs to Grace's account, and shows on her character's page
		await web.goto(`/web/c/${grace.characterId}`);
		const uploads = web.locator('.character__block-section', { hasText: 'Unranked Beatmaps' });
		await expect(uploads.locator('.list__beatmap', { hasText: title })).toBeVisible();
		await web.close();

		// a second upload replaces that set, it adds no other
		await page.keyboard.press('1');
		await page.getByRole('button', {
			name: 'Upload', exact: true, 
		}).click();
		await expect(message(page, 'Updated online')).toBeVisible({ timeout: 30_000 });
		expect((await unranked(page, title)).map(set => set.id)).toEqual([online.id]);

		// anyone can download it, but only Grace can replace it
		const other = await playerAs(heidi);
		await other.goto('/');
		expect((await other.request.get(`/v1/beatmap/osz/${online.id}`)).status()).toBe(200);
		const taken = await send(other, cleanOsz(title, {
			creator: heidi.name, setId: online.id, 
		}));
		expect(taken.status()).toBe(422);
		expect((await taken.json()).code).toBe('notYours');

		expect((await page.request.delete(`/v1/beatmap/upload/${online.id}`)).ok()).toBe(true);
		expect(await unranked(page, title)).toEqual([]);
	});

	test('the server runs the map checks on every difficulty', async ({ playerAs }) => {
		const page = await playerAs(grace);
		await page.goto('/');
		const chart = (version: string, objects: string[]) => strToU8([
			'osu file format v14', '', '[General]', 'AudioFilename: song.mp3', 'Mode: 3', '',
			'[Metadata]', 'Title:Gate', 'Artist:e2e', 'Creator:Grace', `Version:${version}`, '',
			'[Difficulty]', 'CircleSize:4', '', '[Events]', '0,0,"bg.jpg",0,0', '',
			'[TimingPoints]', '0,500,4,2,0,100,1,0', '', '[HitObjects]', ...objects, '',
		].join('\r\n'));
		const osz = zipSync({
			'easy.osu': chart('Easy', ['64,192,1000,1,0,0:0:0:0:']),
			// two notes on the same spot
			'hard.osu': chart('Hard', ['64,192,1000,1,0,0:0:0:0:', '64,192,1000,1,0,0:0:0:0:']),
		});
		const res = await page.request.post('/v1/beatmap/upload', {
			multipart: {
				file: {
					name: 'gate.osz', mimeType: 'application/octet-stream', buffer: Buffer.from(osz), 
				}, 
			}, 
		});
		expect(res.status()).toBe(422);
		const body = await res.json();
		expect(body.code).toBe('checks');
		expect(body.problems).toEqual([{
			file: 'hard.osu', version: 'Hard', checks: ['overlap'], 
		}]);
	});

	test('three new maps a month, then the quota refuses', async ({ playerAs }) => {
		const page = await playerAs(heidi);
		await page.goto('/');
		const upload = (title: string, setId?: number) => send(page, cleanOsz(title, {
			creator: heidi.name, setId, 
		}));
		const ids: number[] = [];
		for (let i = 0; i < 3; i++) {
			const res = await upload(`Quota ${i}`);
			expect(res.ok()).toBe(true);
			ids.push((await res.json()).setId);
		}
		// taking one down gives no slot back
		await page.request.delete(`/v1/beatmap/upload/${ids[0]}`);
		const refused = await upload('Quota 3');
		expect(refused.status()).toBe(422);
		expect((await refused.json()).code).toBe('quota');
		// an update takes none
		const update = await upload('Quota 1', ids[1]);
		expect(update.ok()).toBe(true);
		expect(await update.json()).toMatchObject({
			setId: ids[1], updated: true, 
		});
	});

	test('a new map goes up only as its Creator\'s, with its ids written in', async ({ playerAs }) => {
		const page = await playerAs(grace);
		await page.goto('/');
		const title = `Creator ${Date.now()}`;
		const refused = await send(page, cleanOsz(title, { creator: 'someone else' }));
		expect(refused.status()).toBe(422);
		expect((await refused.json()).code).toBe('notCreator');

		const res = await send(page, cleanOsz(title, {
			creator: grace.name, background: jpeg(1600, 900),
		}));
		expect(res.ok()).toBe(true);
		const { setId, updated, ids } = await res.json();
		// its background's small card cover, baked beside it for song select
		const cover = await page.request.get(`/v1/beatmap/preview/${setId}/${setId}.jpg.cover.jpg`);
		expect(cover.ok()).toBe(true);
		expect(cover.headers()['content-type']).toBe('image/jpeg');
		expect(updated).toBe(false);
		expect(ids.setId).toBe(setId);
		// the stored file carries them too
		const [{ chart }] = await query<{ chart: string }>(
			'SELECT chart FROM beatmap WHERE set_id = ?', [setId],
		);
		expect(chart).toContain(`BeatmapSetID:${setId}`);
		expect(chart).toContain(`BeatmapID:${ids.beatmaps['map.osu']}`);
	});

	test('a known osu! map is its mapper\'s, ranked until they unrank it', async ({ playerAs }) => {
		// an osu! set credited to Grace, ranked here
		const osuId = 900_000_000 + Math.floor(Math.random() * 90_000_000);
		await query(
			'INSERT INTO beatmapset (osu_id, artist, title, creator, owner_user_id) '
			+ 'VALUES (?, \'e2e\', ?, ?, ?)',
			[osuId, `Known ${osuId}`, grace.name, grace.id],
		);
		// ranked in 4K: a set's status is its ruleset's
		await query(
			'INSERT INTO mania4k_beatmapset_status (set_id, status, ranked_at) '
			+ 'SELECT id, \'ranked\', NOW() FROM beatmapset WHERE osu_id = ?',
			[osuId],
		);
		const file = (account: Account) => cleanOsz(`Known ${osuId}`, {
			creator: account.name, setId: osuId, 
		});

		const other = await playerAs(heidi);
		await other.goto('/');
		expect((await (await send(other, file(heidi))).json()).code).toBe('notYours');

		const page = await playerAs(grace);
		await page.goto('/');
		expect((await (await send(page, file(grace))).json()).code).toBe('ranked');
		const own = await (await page.request.get(`/v1/beatmap/upload/of/${osuId}`)).json();
		expect(own.status).toBe('ranked');

		expect((await page.request.post(`/v1/beatmap/upload/${own.setId}/unrank`)).ok()).toBe(true);
		const res = await send(page, file(grace));
		expect(res.ok()).toBe(true);
		expect(await res.json()).toMatchObject({
			setId: own.setId, updated: true, ids: { setId: osuId }, 
		});
		const [online] = await unranked(page, `Known ${osuId}`);
		expect(online).toMatchObject({
			id: own.setId, status: 'unranked', 
		});
	});

	test('a map is submitted for rank, sent back with a reason, withdrawn', async ({ playerAs }) => {
		await query('INSERT IGNORE INTO user_group (user_id, `group`) VALUES (?, \'admin\')', [heidi.id]);
		try {
			const page = await playerAs(grace);
			const title = `Submit ${Date.now()}`;
			await new Game(page).newMap(`${title}.wav`, silence(40));
			await fillAndUpload(page);
			await page.locator('.web__close').click();

			// submitting uploads it as it stands, then queues it - locked meanwhile
			await page.getByRole('button', { name: 'Submit for rank' }).click();
			await expect(message(page, 'Submitted for rank')).toBeVisible({ timeout: 30_000 });
			await expect(page.locator('.editor__submission')).toContainText('In the ranking queue');
			const [online] = await unranked(page, title);
			expect(online.status).toBe('pending');
			await page.getByRole('button', {
				name: 'Upload', exact: true, 
			}).click();
			await expect(message(page, 'withdraw it to update it')).toBeVisible();

			// the admin queue shows who submitted it; sending it back makes it theirs again
			const admin = await playerAs(heidi);
			await admin.goto('/');
			const queue = await (await admin.request.get('/v1/beatmap/nomination')).json();
			expect(queue.find((row: { id: number }) => row.id === online.id).submittedBy).toBe(grace.name);
			expect((await admin.request.patch(`/v1/beatmap/nomination/${online.id}`, {
				data: {
					status: 'unranked', note: 'Needs a harder difficulty', 
				}, 
			})).ok()).toBe(true);

			// an upload shows it back, and why
			await page.getByRole('button', {
				name: 'Upload', exact: true, 
			}).click();
			await expect(message(page, 'Updated online')).toBeVisible({ timeout: 30_000 });
			await expect(page.locator('.editor__review')).toHaveText('Sent back: Needs a harder difficulty');

			// submitted again, then withdrawn
			await page.getByRole('button', { name: 'Submit for rank' }).click();
			await expect(page.locator('.editor__submission')).toContainText('In the ranking queue');
			await page.getByRole('button', { name: 'Withdraw' }).click();
			await expect(page.getByRole('button', { name: 'Submit for rank' })).toBeVisible();
			expect((await unranked(page, title))[0].status).toBe('unranked');

			// planned: the mapper is told it isn't live yet, never when it will be
			await page.getByRole('button', { name: 'Submit for rank' }).click();
			await expect(page.locator('.editor__submission')).toContainText('In the ranking queue');
			expect((await admin.request.patch(`/v1/beatmap/nomination/${online.id}`, {
				data: {
					status: 'ranked', rankedAt: new Date(Date.now() + 86_400_000).toISOString(),
				},
			})).ok()).toBe(true);
			const planned = await (await page.request.get(`/v1/beatmap/upload/of/${online.id}`)).json();
			expect(planned).toMatchObject({
				status: 'ranked', scheduled: true,
			});
			expect(planned).not.toHaveProperty('rankedAt');

			// ranked as any other map: in the game's catalog, among the ranked ones
			expect((await admin.request.patch(`/v1/beatmap/nomination/${online.id}`, {
				data: {
					status: 'ranked', rankedAt: new Date().toISOString(), 
				}, 
			})).ok()).toBe(true);
			expect((await (await page.request.get(`/v1/beatmap/upload/of/${online.id}`)).json()).scheduled)
				.toBe(false);
			const catalog = await (await admin.request.get('/v1/beatmap/catalog')).json();
			expect(catalog.beatmaps.some((set: { id: number }) => set.id === online.id)).toBe(true);
			const ranked = await (await admin.request.get(
				`/v1/beatmap/all/desc?status=ranked&q=${encodeURIComponent(title)}`,
			)).json();
			expect(ranked.map((set: { id: number }) => set.id)).toEqual([online.id]);
		} finally {
			await query('DELETE FROM user_group WHERE user_id = ? AND `group` = \'admin\'', [heidi.id]);
			// a ranked e2e map would be the catalog's easiest, which other specs open
			await query(
				`UPDATE mania4k_beatmapset_status s JOIN beatmapset b ON b.id = s.set_id
				SET s.status = 'rejected' WHERE b.owner_user_id = ?`,
				[grace.id],
			);
		}
	});

});
