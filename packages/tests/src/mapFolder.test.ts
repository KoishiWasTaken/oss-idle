import {
	afterEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('electron', () => ({ shell: { openPath: vi.fn(async () => '') } }));

const {
	closeMapFolder,
	openMapFolder,
	writeMapFolder,
} = await import('../../desktop/src/mapFolder');

const bytes = (text: string) => new TextEncoder().encode(text);
const settle = () => new Promise(resolve => setTimeout(resolve, 900));

describe('the map folder', () => {
	afterEach(() => closeMapFolder());

	it('holds the set, sends back what the player changes, and not what the game wrote', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'map-folder-'));
		const sent: Record<string, Uint8Array | undefined>[] = [];
		// a sound the player left there while it wasn't watched
		fs.mkdirSync(path.join(root, 'maps', '12 A_ B'), { recursive: true });
		fs.writeFileSync(path.join(root, 'maps', '12 A_ B', 'kick.wav'), 'kick');
		const sender = {
			isDestroyed: () => false, send: (_: string, files: never) => sent.push(files), 
		};
		await openMapFolder(root, sender as never, '12 A: B', {
			'map [Hard].osu': bytes('osu'), 'soft-hitclap.wav': bytes('clap'), 'sb/bg.png': bytes('png'),
		});
		const folder = path.join(root, 'maps', '12 A_ B');
		expect(fs.readFileSync(path.join(folder, 'sb', 'bg.png'), 'utf8')).toBe('png');

		expect(Object.keys(sent.shift() ?? {})).toEqual(['kick.wav']);
		expect(fs.existsSync(path.join(folder, 'kick.wav'))).toBe(true);

		writeMapFolder({
			'map [Hard].osu': bytes('saved'), '../outside.txt': bytes('no'), 
		});
		expect(fs.existsSync(path.join(root, 'maps', 'outside.txt'))).toBe(false);
		await settle();
		expect(sent).toEqual([]);

		fs.writeFileSync(path.join(folder, 'soft-hitclap2.wav'), 'new');
		fs.writeFileSync(path.join(folder, 'soft-hitclap.wav'), 'changed');
		fs.rmSync(path.join(folder, 'sb', 'bg.png'));
		await settle();
		const changed = Object.assign({}, ...sent);
		expect(Object.keys(changed).sort()).toEqual(['sb/bg.png', 'soft-hitclap.wav', 'soft-hitclap2.wav']);
		expect(new TextDecoder().decode(changed['soft-hitclap.wav'])).toBe('changed');
		expect(changed['sb/bg.png']).toBeUndefined();
	});

	it('keeps what the player changed while it was closed for a test play', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'map-folder-'));
		const sent: Record<string, Uint8Array | undefined>[] = [];
		const sender = {
			isDestroyed: () => false, send: (_: string, files: never) => sent.push(files),
		};
		const files = {
			'map [Hard].osu': bytes('osu'), 'drum-hitclap.wav': bytes('clap'),
		};
		await openMapFolder(root, sender as never, '12 A', files, false);
		closeMapFolder();
		const clap = path.join(root, 'maps', '12 A', 'drum-hitclap.wav');
		fs.writeFileSync(clap, 'edited');
		fs.utimesSync(clap, new Date(), new Date(Date.now() + 5000));
		fs.writeFileSync(path.join(root, 'maps', '12 A', 'map [Hard].osu'), 'stray');

		await openMapFolder(root, sender as never, '12 A', files, false);
		expect(fs.readFileSync(clap, 'utf8')).toBe('edited');
		expect(fs.readFileSync(path.join(root, 'maps', '12 A', 'map [Hard].osu'), 'utf8')).toBe('osu');
		expect(new TextDecoder().decode(Object.assign({}, ...sent)['drum-hitclap.wav'])).toBe('edited');
	});
});
