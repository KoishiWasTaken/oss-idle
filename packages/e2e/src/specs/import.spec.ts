import {
	expect,
	test,
} from '../support/fixtures';

/** An .osz dropped on the window becomes a local set: listed, and played locally. */
test.describe('local import', () => {

	test('a dropped .osz imports as a local set and plays', async ({ game, page }) => {
		await game.start();
		const { set } = await game.easiestMap();

		const drop = () => page.evaluate(async (id) => {
			const osz = await (await fetch(`/v1/beatmap/osz/${id}`)).blob();
			const transfer = new DataTransfer();
			transfer.items.add(new File([osz], 'local.osz'));
			window.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer }));
		}, set.id);
		const localSets = async () => (await game.installedSets()).filter(id => id < 0);
		// a newer message closes the older ones, so this is the latest import's
		const imported = page.locator('.message__contents:not(.closing)')
			.filter({ hasText: `Imported ${set.title}` });

		await drop();
		await expect(imported).toBeVisible({ timeout: 60_000 });
		const [local] = await localSets();
		expect(local).toBeDefined();

		// the same map again replaces it, under the same id
		await drop();
		await expect(imported).toBeVisible({ timeout: 60_000 });
		expect(await localSets()).toEqual([local]);

		await game.search(set.title);
		const card = page.locator('.bm-card[data-id^="-"]').first();
		await expect(card).toBeVisible();
		const diffId = Number(await card.getAttribute('data-id'));

		await game.playCard(diffId);
		const play = await game.waitForPlay();
		expect(play.beatmapId).toBe(diffId);
		expect(play.mode).toBe('guest');
	});

});

test.describe('editor menu', () => {

	test('Import picks an .osz and opens song select on it', async ({ game, page }) => {
		await game.openMenu();
		const { set } = await game.easiestMap();
		const osz = await (await page.request.get(`/v1/beatmap/osz/${set.id}`)).body();

		await page.locator('.menu__logo-enter').click();
		await game.menuOption('Editor').click();
		const chooser = page.waitForEvent('filechooser');
		await game.menuOption('Import').click();
		await (await chooser).setFiles({
			name: 'local.osz', mimeType: 'application/octet-stream', buffer: osz,
		});

		await game.expectScene('SELECT');
		const card = page.locator('.bm-card.is-active[data-id^="-"]');
		await expect(card).toBeVisible({ timeout: 60_000 });
		await card.click();
		await game.expectScene('EDITOR');
		await expect(page.locator('.editor__playfield')).toBeVisible();

		await page.keyboard.press('Escape');
		await game.expectScene('SELECT');
	});

	test('Select opens song select, where a map opens in the editor', async ({ game, page }) => {
		await game.openMenu();
		const { set, version } = await game.installEasiest();

		await page.locator('.menu__logo-enter').click();
		await game.menuOption('Editor').click();
		await game.menuOption('Select').click();
		await game.expectScene('SELECT');

		await game.search(set.title);
		await game.selectCard(version.id);
		// it opens once the card is backed by the downloaded map, like a play
		await expect(async () => {
			await game.card(version.id).click();
			await game.expectScene('EDITOR', 3_000);
		}).toPass({ timeout: 60_000 });
	});

});
