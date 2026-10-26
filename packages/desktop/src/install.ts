import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
	app,
	type BrowserWindow,
	dialog,
} from 'electron';

// eslint-disable-next-line @stylistic/max-len
import type { DesktopMoveResult } from '@oss-idle/shared/desktop' with { 'resolution-mode': 'import' };

const installDir = path.dirname(process.execPath);

/** Every NSIS install keeps a copy of its installer in the updater cache; re-running it
 *  with /D= installs there and uninstalls the old folder. AppImage/dmg are already portable. */
function storedInstaller(): string | undefined {
	if (process.platform !== 'win32' || !app.isPackaged || !process.env.LOCALAPPDATA) return undefined;
	try {
		const config = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
		const cacheDir = /^updaterCacheDirName:\s*['"]?(.+?)['"]?\s*$/m.exec(config)?.[1];
		if (!cacheDir) return undefined;
		const installer = path.join(process.env.LOCALAPPDATA, cacheDir, 'installer.exe');
		return fs.existsSync(installer) ? installer : undefined;
	} catch {
		return undefined;
	}
}

export const canMoveInstall = !!storedInstaller();

/** The player's maps, skins and add-ons, kept by updates and uninstalls (installer.nsh). */
const LIBRARY_DIRS = ['maps', 'skins', 'addons'];

const GAME_DIRS = new Set(['locales', 'resources', ...LIBRARY_DIRS]);
const GAME_FILE = /\.(dll|pak|bin|dat|json|html|txt|ico)$|^Uninstall .*\.exe$/i;

/** This install's folder, when it holds only the game. An update lands in the folder the
 *  installer registered, which a folder moved by hand no longer is, and wipes the folder it
 *  updates, so a folder with anything else in it is left to the registered one. */
export function updateDir(): string | undefined {
	if (process.platform !== 'win32') return undefined;
	try {
		const entries = fs.readdirSync(installDir, { withFileTypes: true });
		const onlyGame = entries.every(entry => (entry.isDirectory()
			? GAME_DIRS.has(entry.name)
			: entry.name === path.basename(process.execPath) || GAME_FILE.test(entry.name)));
		return onlyGame ? installDir : undefined;
	} catch {
		return undefined;
	}
}

/** Where maps, skins and add-ons live: beside the game on Windows, so moving the install
 *  moves them; the data folder where the install can't hold them (AppImage, macOS, dev). */
export const libraryRoot = (): string => {
	if (process.platform === 'win32' && app.isPackaged) {
		try {
			const probe = path.join(installDir, '.write-test');
			fs.writeFileSync(probe, '');
			fs.rmSync(probe);
			return installDir;
		} catch { /* a read-only install */ }
	}
	return app.getPath('userData');
};

/** A move in progress: the library copied from one install to the other. */
const movedFile = () => path.join(app.getPath('userData'), 'moved-install.json');

/** Once the game runs from either side of a move, the other side's copy of the library goes:
 *  the old one when the move worked, the new one when it didn't. */
export const finishMove = (): void => {
	let moved: { from: string, to: string };
	try {
		moved = JSON.parse(fs.readFileSync(movedFile(), 'utf8'));
	} catch {
		return;
	}
	const sides: Record<string, string> = {
		[moved.to]: moved.from, [moved.from]: moved.to,
	};
	const stale = sides[installDir];
	try {
		if (stale) {
			for (const dir of LIBRARY_DIRS) fs.rmSync(path.join(stale, dir), {
				recursive: true, force: true, 
			});
			// the old install's folder, emptied by its uninstall
			if (stale === moved.from && !fs.readdirSync(stale).length) fs.rmdirSync(stale);
		}
		fs.rmSync(movedFile());
	} catch (e) {
		console.error('[install] cleaning up after a move failed', e);
	}
};

export async function moveInstall(
	win: BrowserWindow | undefined,
	title: string,
): Promise<DesktopMoveResult> {
	const installer = storedInstaller();
	if (!installer) return 'unavailable';
	const options: Electron.OpenDialogOptions = {
		title,
		defaultPath: path.dirname(installDir),
		properties: ['openDirectory', 'createDirectory'],
	};
	const picked = await (win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options));
	const parent = picked.filePaths[0];
	if (picked.canceled || !parent) return 'cancelled';

	const target = path.join(parent, path.basename(installDir));
	const fromInstall = path.relative(installDir, target);
	// the old folder is wiped once the new install lands
	const outside = fromInstall === '..' || fromInstall.startsWith(`..${path.sep}`)
		|| path.isAbsolute(fromInstall);
	if (!outside) return 'inside';
	try {
		fs.mkdirSync(target, { recursive: true });
		// a later uninstall wipes the folder (but the library), so it must hold only the game
		if (fs.readdirSync(target).length > 0) return 'not-empty';
		// the old install is removed before the new one is written: never start on a folder that can't take it
		const probe = path.join(target, '.write-test');
		fs.writeFileSync(probe, '');
		fs.rmSync(probe);
	} catch {
		return 'not-writable';
	}

	// copied, not moved: the old install keeps its own until the new one has started
	try {
		for (const dir of LIBRARY_DIRS) {
			const from = path.join(installDir, dir);
			if (fs.existsSync(from)) await fs.promises.cp(from, path.join(target, dir), { recursive: true });
		}
		fs.writeFileSync(movedFile(), JSON.stringify({
			from: installDir, to: target,
		}));
	} catch {
		for (const dir of LIBRARY_DIRS) fs.rmSync(path.join(target, dir), {
			recursive: true, force: true, 
		});
		return 'not-writable';
	}

	spawn(installer, ['--updated', '/S', '--force-run', `/D=${target}`], {
		detached: true,
		stdio: 'ignore',
	}).unref();
	app.quit();
	return 'moving';
}
