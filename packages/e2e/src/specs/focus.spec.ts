import type { Page } from '@playwright/test';
import {
	expect,
	test,
} from '../support/fixtures';

/**
 * Where typing goes. The topmost surface that takes text holds the keyboard
 * (input/keyboardOwner.ts): options over chat over song select, and each one
 * hands it back when it closes, after a click elsewhere or a window switch.
 */
test.describe('keyboard focus', () => {

	const songSearch = (page: Page) => page.locator('.songsearch__input');
	const optionsSearch = (page: Page) => page.locator('.options__search_input');
	const chatInput = (page: Page) => page.locator('.chat__compose input');

	const toggleOptions = (page: Page) => page.keyboard.press('Control+Shift+O');

	/** The window loses focus and the page with it, then comes back. */
	const refocusWindow = (page: Page) => page.evaluate(() => {
		(document.activeElement as HTMLElement | null)?.blur();
		window.dispatchEvent(new Event('focus'));
	});

	test('song select keeps its search, through clicks and window switches', async ({ game, page }) => {
		await game.start();
		await expect(songSearch(page)).toBeFocused();

		await page.mouse.click(1000, 250);
		await expect(songSearch(page)).toBeFocused();

		await refocusWindow(page);
		await expect(songSearch(page)).toBeFocused();
	});

	test('options take typing over song select, and give it back', async ({ game, page }) => {
		await game.start();
		await toggleOptions(page);
		await expect(optionsSearch(page)).toBeFocused();

		// a click on the panel, then a key: it lands in the options search
		await page.locator('.options__panel').click({
			position: {
				x: 300, y: 650,
			},
		});
		await page.keyboard.type('vol');
		await expect(optionsSearch(page)).toHaveValue('vol');
		await expect(songSearch(page)).toHaveValue('');

		await refocusWindow(page);
		await expect(optionsSearch(page)).toBeFocused();

		await toggleOptions(page);
		await expect(songSearch(page)).toBeFocused();
	});

	test('chat takes typing, options go over it, and each hands back', async ({ game, page }) => {
		await game.start();
		await page.keyboard.press('F8');
		await expect(chatInput(page)).toBeFocused();

		await toggleOptions(page);
		await expect(optionsSearch(page)).toBeFocused();
		await toggleOptions(page);
		await expect(chatInput(page)).toBeFocused();

		await page.keyboard.press('F8');
		await expect(songSearch(page)).toBeFocused();
	});

	test('a click puts typing in the roster search, else it is the chat', async ({ game, page }) => {
		await game.start();
		await page.keyboard.press('F9');
		const roster = page.locator('.community-header__search');
		await roster.click();
		await page.keyboard.type('ab');
		await expect(roster).toHaveValue('ab');

		await refocusWindow(page);
		await page.mouse.click(640, 400);
		await expect(chatInput(page)).toBeFocused();
	});

	test('Escape closes the topmost surface only', async ({ game, page }) => {
		await game.start();
		await page.keyboard.type('zz');
		await page.keyboard.press('F8');
		await toggleOptions(page);
		await expect(optionsSearch(page)).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(page.locator('.options__container.open')).toBeHidden();
		await expect(chatInput(page)).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(songSearch(page)).toBeFocused();
		await expect(songSearch(page)).toHaveValue('zz');

		await page.keyboard.press('F1');
		await page.keyboard.press('Escape');
		await expect(songSearch(page)).toBeFocused();
		await expect(songSearch(page)).toHaveValue('zz');
		expect(await game.scene()).toBe('SELECT');
	});

	test('mod select keeps typing out of the song search', async ({ game, page }) => {
		await game.start();
		await page.keyboard.press('F1');
		await expect(songSearch(page)).not.toBeFocused();
		await page.keyboard.type('x');
		await expect(songSearch(page)).toHaveValue('');

		await page.keyboard.press('F1');
		await expect(songSearch(page)).toBeFocused();
	});

	test('the main menu takes no typing, its options do', async ({ game, page }) => {
		await game.openMenu();
		await toggleOptions(page);
		await expect(optionsSearch(page)).toBeFocused();
		await toggleOptions(page);
		await expect(optionsSearch(page)).not.toBeFocused();
	});
});
