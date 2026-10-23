import {
	defineConfig,
	devices,
} from '@playwright/test';

/**
 * The end-to-end suite runs against the *dev* stack's API (:3873) and web app
 * (:5174), with the client built in development mode (the test bridge kept) and
 * served on :5175 - a fresh page loads a few bundles instead of ~700 dev modules.
 * It is deliberately kept out of `npm test`: a spec here boots a browser,
 * downloads a beatmap and plays it, so it is minutes where the vitest suite is
 * seconds.
 *
 * `webServer` reuses the dev stack the developer already has running (and only
 * starts one when there is none), and builds and serves the client each run.
 */

const PORT = Number(process.env.E2E_PORT ?? 5175);
const API_PORT = Number(process.env.DEV_API_PORT ?? 3873);

export default defineConfig({
	testDir: './src/specs',
	outputDir: './test-results',
	// a play is a real clock, and a first-run context downloads a beatmap
	timeout: 180_000,
	expect: { timeout: 20_000 },
	// every test has a context and accounts of its own (accounts.ts)
	fullyParallel: true,
	workers: Number(process.env.E2E_WORKERS ?? (process.env.CI ? 1 : 4)),
	// a failure runs again, recorded: recording every test cost a third of the run
	retries: 1,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never' }]]
		: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'on-first-retry',
		video: 'on-first-retry',
		screenshot: 'only-on-failure',
		actionTimeout: 20_000,
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: {
					width: 1280, height: 800,
				},
				launchOptions: {
					args: [
						// the intro gates on a click, but song select previews and
						// gameplay audio must not need one of their own
						'--autoplay-policy=no-user-gesture-required',
						'--mute-audio',
						// the gameplay canvas is drawn every frame; keep it off the
						// GPU so a headless run is deterministic
						'--disable-gpu',
					],
				},
			},
		},
	],
	webServer: [{
		command: 'npm run dev',
		cwd: '../..',
		url: `http://localhost:${API_PORT}/health`,
		reuseExistingServer: true,
		timeout: 180_000,
		stdout: 'ignore',
		stderr: 'pipe',
	}, {
		command: `npm -w @oss-idle/client run e2e:serve -- --port ${PORT}`,
		cwd: '../..',
		url: `http://localhost:${PORT}`,
		// a runner that builds and serves the client itself (ops e2e/nm/job)
		reuseExistingServer: !!process.env.E2E_APP_UP,
		timeout: 180_000,
		stdout: 'ignore',
		stderr: 'pipe',
	}],
});
