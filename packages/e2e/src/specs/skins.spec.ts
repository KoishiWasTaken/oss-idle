import {
	strToU8,
	zipSync,
} from 'fflate';

import {
	type Account,
	query,
	testAccounts,
} from '../support/accounts';
import { silence } from '../support/files';
import {
	expect,
	test,
} from '../support/fixtures';
import Game from '../support/game';

// a 1x1 white PNG
const PIXEL = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
	'base64',
);

/** An osu!stable skin as it exports one: a skin.ini, a note, a muted hitsound, and junk no
 *  skin holds, all in the folder the skin was zipped from. */
const osk = (name: string) => Buffer.from(zipSync({
	[`${name}/skin.ini`]: strToU8([
		'[General]', `Name: ${name}`, 'Author: e2e', 'Version: 2.7',
		'[Mania]', 'Keys: 4', 'ColumnWidth: 40,40,40,40',
	].join('\n')),
	[`${name}/mania-note1@2x.png`]: PIXEL,
	[`${name}/normal-hitnormal.wav`]: new Uint8Array(silence(0)),
	[`${name}/project.psd`]: strToU8('not a skin file'),
}));

/**
 * osu! skins: imported from an .osk, played, published with their files, browsed with
 * only what is shown downloaded.
 */
test.describe('skins', () => {
	let olga: Account;
	const name = `e2e skin ${Date.now()}`;

	test.beforeAll(async () => {
		[olga] = await testAccounts('skins');
	});

	test.afterAll(async () => {
		await query('DELETE FROM skin WHERE author_id = ?', [olga.id]);
	});

	test('an .osk imports, publishes with its files, and shows what it holds', async ({
		playerAs,
	}) => {
		const page = await playerAs(olga);
		const game = new Game(page);
		await game.start();
		await page.keyboard.press('Control+Shift+O');
		await page.locator('.options__search_input').fill('skins');
		await page.getByRole('button', { name: 'Manage skins' }).click();

		const chooser = page.waitForEvent('filechooser');
		await page.locator('.page__baraction', { hasText: 'Import an .osk' }).click();
		await (await chooser).setFiles({
			name: `${name}.osk`, mimeType: 'application/zip', buffer: osk(name),
		});
		const imported = page.locator('.listing', { hasText: name });
		await expect(imported).toContainText('Imported');
		await expect(imported.getByRole('checkbox', { name: 'Enabled' })).toBeChecked();

		// what it holds, read from the installed files
		await imported.getByRole('button', { name: 'Details' }).click();
		await expect(page.locator('.skin-contents__summary')).toContainText('3 files');
		await page.locator('summary', { hasText: 'osu!mania' }).click();
		await expect(page.locator('.skin-file__name', { hasText: 'mania-note1@2x.png' })).toBeVisible();
		const bar = (label: string) => page.locator('.page__baraction', { hasText: label }).last();
		await bar('Back').click();

		// published: the catalog keeps its files, by their content
		await imported.getByRole('button', { name: 'Publish' }).click();
		await bar('Save').click();
		const own = page.locator('.listing', { hasText: name }).filter({ hasText: 'Unpublished' });
		await expect(own).toBeVisible();
		type Listed = { id: number, name: string };
		const mySkins = await (await page.request.get('/v1/skins/me')).json() as Listed[];
		const mine = mySkins.find(s => s.name === name)!;
		const skin = await (await page.request.get(`/v1/skins/${mine.id}`)).json() as {
			files: { path: string, hash: string, size: number }[], fileCount: number,
		};
		expect(skin.files.map(f => f.path).sort())
			.toEqual(['mania-note1@2x.png', 'normal-hitnormal.wav', 'skin.ini']);
		const note = skin.files.find(f => f.path.endsWith('.png'))!;
		const served = await page.request.get(`/skin-files/${note.hash}.png`);
		expect(served.status()).toBe(200);
		expect(served.headers()['content-type']).toContain('image/png');

		// the installed copy is the catalog skin now, still on
		const installed = page.locator('.listing', { hasText: name }).filter({ hasText: 'Enabled' });
		await expect(installed).not.toContainText('Imported');
		await expect(installed.getByRole('checkbox', { name: 'Enabled' })).toBeChecked();

		await own.getByRole('button', { name: 'Submit' }).click();
		const search = `/v1/skins?q=${encodeURIComponent(name)}`;
		const listed = await (await page.request.get(search)).json() as unknown[];
		expect(listed).toHaveLength(1);

		await installed.getByRole('button', { name: 'Uninstall' }).click();
		const defaultSkin = page.locator('.listing', { hasText: 'Default skin' });
		await expect(defaultSkin.getByRole('checkbox', { name: 'Enabled' })).toBeChecked();
	});


	test('the options pick the gameplay and editor skins', async ({ playerAs }) => {
		const page = await playerAs(olga);
		const game = new Game(page);
		await game.start();
		const openSkinOptions = async () => {
			await page.keyboard.press('Control+Shift+O');
			await page.locator('.options__search_input').fill('skin');
		};
		await openSkinOptions();
		await page.getByRole('button', { name: 'Manage skins' }).click();
		const [first, second] = [`${name} A`, `${name} B`];
		for (const skin of [first, second]) {
			const chooser = page.waitForEvent('filechooser');
			await page.locator('.page__baraction', { hasText: 'Import an .osk' }).click();
			await (await chooser).setFiles({
				name: `${skin}.osk`, mimeType: 'application/zip', buffer: osk(skin),
			});
			await expect(page.locator('.listing', { hasText: skin })).toContainText('Imported');
		}

		const row = (label: string) => page.locator('.options__container .opt-row', { hasText: label });
		const pick = async (label: string, skin: string, shot?: string) => {
			await row(label).locator('.dropdown__current').click();
			const option = row(label).locator('.dropdown__option', { hasText: skin });
			await expect(option).toBeVisible();
			if (shot) {
				await page.waitForTimeout(500);
				await page.screenshot({ path: `../../screenshots/${shot}.png` });
			}
			await option.click();
			await expect(row(label).locator('.dropdown__label')).toHaveText(skin);
		};
		await openSkinOptions();
		await expect(row('Current skin').locator('.dropdown__label')).toHaveText(second);
		await pick('Current skin', first, 'skin-dropdown-current');
		await pick('Editor skin', second, 'skin-dropdown-editor');

		const listing = (skin: string) => page.locator('.listing', { hasText: skin });
		await page.getByRole('button', { name: 'Manage skins' }).click();
		await expect(listing(first).getByRole('checkbox', { name: 'Enabled' })).toBeChecked();
		await expect(listing(second).getByRole('checkbox', { name: 'Enabled' })).not.toBeChecked();
		await expect(listing(second).getByRole('checkbox', { name: 'Editor' })).toBeChecked();

		await openSkinOptions();
		await pick('Current skin', 'Default skin');
		await page.getByRole('button', { name: 'Manage skins' }).click();
		await expect(listing('Default skin').getByRole('checkbox', { name: 'Enabled' })).toBeChecked();
	});
});
