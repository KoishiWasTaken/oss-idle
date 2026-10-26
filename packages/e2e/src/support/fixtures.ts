import type {
	BrowserContext,
	Page,
} from '@playwright/test';
import {
	expect,
	test as base,
} from '@playwright/test';

import {
	type Account,
	signIn,
} from './accounts';
import Game from './game';

/**
 * Every spec gets a fresh browser context, so the local sql.js database, the
 * IndexedDB it persists to and the settings all start empty: each test is a
 * first-run player.
 */

/** Console noise a healthy dev run produces anyway. */
const IGNORED = [
	/Download the React DevTools/i,
	/\[vite\]/i,
	/favicon/i,
	/WebSocket/i,
	/AudioContext/i,
	// the session probe a signed-out client makes on boot
	/401 \(Unauthorized\)/,
];

/** A character's first pass, upgrade or chat earns a medal, and its overlay
 *  covers the screen. The per-worker accounts earn them on their first runs:
 *  press it away (it keeps Escape to itself: skip the animation, then close). */
/** CSS and web animations at 4x: a click waits for its target to stop moving. */
const fastAnimations = async (page: Page) => {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Animation.enable');
	await cdp.send('Animation.setPlaybackRate', { playbackRate: 4 });
};

const dismissMedals = async (page: Page) => {
	await page.addLocatorHandler(page.locator('.medal-overlay'), async overlay => {
		await expect(async () => {
			await page.keyboard.press('Escape');
			await expect(overlay).toBeHidden({ timeout: 1000 });
		}).toPass({ timeout: 15_000 });
	});
};

type Fixtures = {
	game: Game;
	/** Errors the page logged during the test, for specs that assert on them. */
	errors: string[];
	/** A page of its own browser context, signed in as `account`. */
	playerAs: (account: Account) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
	errors: async ({ page }, use) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() !== 'error') return;
			const text = msg.text();
			if (IGNORED.some(p => p.test(text))) return;
			errors.push(text);
		});
		page.on('pageerror', (err) => errors.push(String(err)));
		await use(errors);
	},
	game: async ({ page }, use) => {
		// the guest wizard opens once the menu lingers past its delay, then
		// swallows song select's keys
		await page.addInitScript(() => localStorage.setItem('tutorial', '99'));
		// a new player's Next song would queue the whole listing behind every
		// launch; the specs build the queues they test
		await page.addInitScript(() => localStorage.setItem('autopilotMode', '"PLAYLIST"'));
		await fastAnimations(page);
		await dismissMedals(page);
		await use(new Game(page));
	},
	playerAs: async ({ browser, baseURL }, use) => {
		const contexts: BrowserContext[] = [];
		await use(async account => {
			const context = await browser.newContext();
			contexts.push(context);
			await signIn(context, account, baseURL!);
			const page = await context.newPage();
			await fastAnimations(page);
			await dismissMedals(page);
			return page;
		});
		await Promise.all(contexts.map(c => c.close()));
	},
});

export { expect };
