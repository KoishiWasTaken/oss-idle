import type { Page } from '@playwright/test';
import {
	expect,
	test,
} from '../support/fixtures';
import Game from '../support/game';
import {
	difficultyOf,
	upload,
} from '../support/uploads';
import {
	query,
	testAccounts,
	type Account,
} from '../support/accounts';

/**
 * Leaderboards of players' unranked maps: a supporter's map has one, a supporter's
 * play opens one for good, and its scores - never ranked - go when the map updates.
 */

type Board = { characterId: number, pp: number }[];

const supporter = (account: Account, on: boolean) => query(
	`UPDATE user SET supporter_until = ${on ? 'NOW() + INTERVAL 1 DAY' : 'NULL'} WHERE id = ?`,
	[account.id],
);

const board = async (page: Page, diffId: number): Promise<Board> =>
	(await page.request.get(`/v1/scores/beatmap/${diffId}`)).json();

/** Download the set through its oss-idle://dl link, then play it from song select to its
 *  result: on the server (a board) or not. Returns the character's total XP from before. */
const playThrough = async (
	page: Page,
	title: string,
	setId: number,
	diffId: number,
	board = true,
) => {
	const game = new Game(page);
	await game.openMenu();
	const xp = (await game.character()).overallTotalXp;
	await page.evaluate(link => new BroadcastChannel('oss-idle:links').postMessage(link), `oss-idle://dl/${setId}`);
	await expect(page.locator('.message__contents', { hasText: `Downloaded ${title}` })).toBeVisible();
	await game.enterSongSelect();
	await game.search(title);
	await game.playCard(diffId);
	const play = await game.waitForPlay();
	// on a board the server runs it, no local session; without one it plays locally
	expect(play.mode).toBe(board ? undefined : 'unranked');
	await game.expectScene('RESULT', 60_000);
	return {
		game, xp, 
	};
};

test.describe('unranked leaderboards', () => {
	let ivan: Account;
	let judy: Account;

	test.beforeEach(async () => {
		[ivan, judy] = await testAccounts('leaderboard');
		await supporter(ivan, true);
		await supporter(judy, false);
	});

	test.afterEach(async () => {
		await supporter(ivan, false);
	});

	test('a supporter\'s map keeps scores, without XP, until it updates', async ({ playerAs }) => {
		const owner = await playerAs(ivan);
		await owner.goto('/');
		const title = `Board ${Date.now()}`;
		const setId = await upload(owner, ivan, title);
		const diffId = await difficultyOf(owner, setId);
		expect(await board(owner, diffId)).toEqual([]);

		const page = await playerAs(judy);
		const { game, xp } = await playThrough(page, title, setId, diffId);
		const scores = await board(page, diffId);
		expect(scores.map(s => s.characterId)).toEqual([judy.characterId]);
		expect(scores[0].pp).toBe(0);
		expect((await game.character()).overallTotalXp).toBe(xp);

		await upload(owner, ivan, title, { setId });
		expect(await board(owner, diffId)).toEqual([]);
	});

	test('a supporter\'s play opens the board of anyone\'s map', async ({ playerAs }) => {
		const owner = await playerAs(judy);
		await owner.goto('/');
		const title = `Opened ${Date.now()}`;
		const setId = await upload(owner, judy, title);
		const diffId = await difficultyOf(owner, setId);

		// not a supporter's: no board yet, so Judy's own play stays on her device
		await playThrough(owner, title, setId, diffId, false);
		expect(await board(owner, diffId)).toEqual([]);

		await playThrough(await playerAs(ivan), title, setId, diffId);
		expect((await board(owner, diffId)).map(s => s.characterId)).toEqual([ivan.characterId]);
	});

});

/** Song select's board: its scores arrive one after the other, and stay doing so. */
test.describe('song select board', () => {

	test('a score saved mid-entry leaves the rest arriving in turn', async ({ game, page }) => {
		await game.start();
		const { set, version } = await game.installEasiest();
		await game.playThenLeave(set.title, version.id);
		await game.search('');
		const rows = page.locator('.lb__list .score_entry__row');
		await expect(rows.first()).toBeVisible({ timeout: 30_000 });

		await page.locator('.bm-card.is-active ~ .bm-card[data-id]').nth(1)
			.click({
				position: {
					x: 60, y: 50, 
				}, 
			});
		await expect(rows.first()).toBeVisible();
		// every board re-fetches on a score write: the scores keep arriving in turn
		await game.finishPlay();
		await page.waitForTimeout(100);
		expect(await rows.count()).toBeLessThan(20);
		await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(20);
	});

});
