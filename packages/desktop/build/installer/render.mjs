// Renders art.html into the installer's page bitmaps and prints each page's hotspots
// (the rects installer.nsh places its controls on). Needs Chromium (CHROME=<path>) and ImageMagick.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME ?? 'chromium';
const flags = ['--headless', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
	'--force-device-scale-factor=1', '--window-size=720,420', '--virtual-time-budget=2000'];

for (const page of ['welcome', 'installing', 'ready-on', 'ready-off', 'updating']) {
	const url = `file://${dir}/art.html#${page}`;
	const png = path.join(dir, `${page}.png`);
	execFileSync(chrome, [...flags, `--screenshot=${png}`, url], { stdio: 'ignore' });
	// the update window is the page's top-left 460x150
	const crop = page === 'updating' ? ['-crop', '460x150+0+0', '+repage'] : [];
	execFileSync('convert', [png, ...crop, '-type', 'TrueColor', `BMP3:${path.join(dir, `${page}.bmp`)}`]);
	execFileSync('rm', [png]);
	const dom = execFileSync(chrome, [...flags, '--dump-dom', url], { encoding: 'utf8' });
	console.log(page, /<pre id="hot">(.*?)<\/pre>/.exec(dom)?.[1]);
}
