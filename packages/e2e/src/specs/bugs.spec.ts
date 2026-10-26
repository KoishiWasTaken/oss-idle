import {
	type Account,
	query,
	testAccounts,
} from '../support/accounts';
import {
	expect,
	test,
} from '../support/fixtures';
import Game from '../support/game';

/** A bug report from the game's options carries the game's add-ons and skins. */
test.describe('bug reports', () => {
	let rita: Account;

	test.beforeAll(async () => {
		[rita] = await testAccounts('bugs');
	});

	test.afterAll(async () => {
		await query('DELETE FROM bug_report WHERE user_id = ?', [rita.id]);
	});

	test('a report sent from the game has its add-ons and skins', async ({ playerAs }) => {
		const page = await playerAs(rita);
		await new Game(page).start();
		await page.keyboard.press('Control+Shift+O');
		await page.locator('.options__search_input').fill('bug');
		// listed under two sections
		await page.getByRole('button', { name: 'Report a bug' }).first().click();

		const site = page.frameLocator('.web__frame');
		await expect(site.getByText('Also your add-ons and skins.')).toBeVisible();
		const title = `e2e setup ${Date.now()}`;
		await site.locator('.bugs__field input').fill(title);
		await site.locator('.bugs__field textarea').fill('Nothing is wrong.');
		await site.getByRole('button', { name: 'Send report' }).click();
		await expect(site.getByRole('heading', { name: title })).toBeVisible();

		const [report] = await query<{ setup: string }>(
			'SELECT setup FROM bug_report WHERE user_id = ? AND title = ?', [rita.id, title],
		);
		expect(report.setup).toBe('skin: default · editor skin: default · add-ons: none');

		// the frame is on the sent report: asking again brings the form back
		await page.locator('.web__close').click();
		await page.keyboard.press('Control+Shift+O');
		await page.locator('.options__search_input').fill('bug');
		await page.getByRole('button', { name: 'Report a bug' }).first().click();
		await expect(site.getByText('Also your add-ons and skins.')).toBeVisible();
	});
});
