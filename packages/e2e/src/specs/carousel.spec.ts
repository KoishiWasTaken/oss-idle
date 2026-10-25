import {
	expect,
	test,
} from '../support/fixtures';
import Game from '../support/game';
import { testAccounts } from '../support/accounts';

/**
 * Song select's carousel: every row, group headers included, rides osu!'s arc.
 */
test.describe('carousel', () => {

	test('with groups, every row sits on the arc', async ({ playerAs }) => {
		const [ada] = await testAccounts('carousel');
		const page = await playerAs(ada);
		const game = new Game(page);
		await game.start();

		await page.locator('.game__group .dropdown__current').click();
		await page.locator('.game__group .dropdown__option', { hasText: 'By Difficulty' }).click();
		await page.locator('.bm-group').first().click();
		await expect(page.locator('.bm-card[data-id]').first()).toBeVisible();
		await page.locator('.carousel').evaluate((el) => { el.scrollTop = 300; });
		await page.waitForTimeout(500);

		// each mounted row's bow, against the bow its on-screen centre calls for
		const off = await page.locator('.carousel').evaluate((scroller) => {
			const half = scroller.clientHeight / 2;
			const top = scroller.getBoundingClientRect().top;
			return [...scroller.querySelectorAll<HTMLElement>('.bm-card')].map((el) => {
				const rect = el.getBoundingClientRect();
				const dist = Math.abs(1 - (rect.top + rect.height / 2 - top) / half);
				const want = (3 - Math.sqrt(Math.max(0, 9 - dist * dist))) * half;
				return Math.abs((parseFloat(el.style.translate) || 0) - want);
			});
		});
		expect(off.length).toBeGreaterThan(3);
		expect(Math.max(...off)).toBeLessThan(1);
		await page.screenshot({ path: test.info().outputPath('carousel-groups.png') });
	});

	test('a card menu keeps clicks off the cards behind it', async ({ playerAs }) => {
		const [ada] = await testAccounts('carousel');
		const page = await playerAs(ada);
		const game = new Game(page);
		await game.start();

		const active = page.locator('.bm-card.is-active');
		await expect(active).toBeVisible();
		const id = await active.getAttribute('data-id');
		await active.click({ button: 'right' });
		await expect(page.locator('.ctxmenu')).toBeVisible();

		// the dim backdrop over another card cancels, like the gray Cancel bar
		const list = (await page.locator('.carousel').boundingBox())!;
		await page.mouse.click(list.x + list.width - 60, list.y + list.height / 4);
		await expect(page.locator('.ctxmenu')).toHaveCount(0);
		await expect(active).toHaveAttribute('data-id', id!);
	});

	test('opening a group below a taller open one keeps its header in place', async ({ playerAs }) => {
		const [ada] = await testAccounts('carousel');
		const page = await playerAs(ada);
		const game = new Game(page);
		await game.start();

		await page.locator('.game__group .dropdown__current').click();
		await page.locator('.game__group .dropdown__option', { hasText: 'By Difficulty' }).click();
		const groups = page.locator('.bm-group');
		await groups.first().click();
		await expect(page.locator('.bm-card[data-id]').first()).toBeVisible();
		// scroll down to the next header, below the open group's cards
		await page.locator('.carousel').evaluate((el) => { el.scrollTop = el.scrollHeight; });
		await page.waitForTimeout(500);
		const next = groups.nth(1);
		const label = await next.locator('.bm-group__label').innerText();
		const before = (await next.boundingBox())!.y;

		await next.click();
		await page.waitForTimeout(500);
		const header = page.locator('.bm-group', { hasText: label });
		await expect(header).toHaveClass(/is-selected/);
		expect(Math.abs((await header.boundingBox())!.y - before)).toBeLessThan(2);
	});

});
