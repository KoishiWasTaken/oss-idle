import {
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { LibraryChange } from '@oss-idle/shared/desktop';

vi.mock('electron', () => ({ shell: { openPath: vi.fn(async () => '') } }));

const {
	initLibrary,
	listLibrary,
	readLibrary,
	removeLibrary,
	writeLibrary,
} = await import('../../desktop/src/library');

const bytes = (text: string) => new TextEncoder().encode(text);
const settle = () => new Promise(resolve => setTimeout(resolve, 900));

describe('the library folders', () => {
	it('lists folders, sends back what the player changes, and not what the game wrote', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'library-'));
		const sent: LibraryChange[] = [];
		initLibrary(root, change => sent.push(change));
		// a skin the player put there before the game looked
		fs.mkdirSync(path.join(root, 'skins', 'Mine', '.git'), { recursive: true });
		fs.writeFileSync(path.join(root, 'skins', 'Mine', 'skin.ini'), '[General]');
		fs.writeFileSync(path.join(root, 'skins', 'Mine', '.git', 'HEAD'), 'ref');
		expect(listLibrary('skins')).toEqual([{
			name: 'Mine', info: undefined, files: [{
				path: 'skin.ini', size: 9,
			}],
		}]);

		const written = writeLibrary('maps', '12 A - B', {
			'map [Hard].osu': bytes('osu'), 'sb/bg.png': bytes('png'), '../outside.txt': bytes('no'),
		}, { id: 12 });
		expect(written?.info).toEqual({ id: 12 });
		expect(written?.files.map(file => file.path).sort()).toEqual(['map [Hard].osu', 'sb/bg.png']);
		expect(fs.existsSync(path.join(root, 'maps', 'outside.txt'))).toBe(false);
		expect(new TextDecoder().decode(await readLibrary('maps', '12 A - B', 'sb/bg.png'))).toBe('png');
		await expect(readLibrary('maps', '..', 'x')).rejects.toThrow();
		await settle();
		expect(sent).toEqual([]);

		const folder = path.join(root, 'maps', '12 A - B');
		fs.writeFileSync(path.join(folder, 'kick.wav'), 'kick');
		fs.rmSync(path.join(folder, 'sb', 'bg.png'));
		await settle();
		expect(sent.map(change => [change.name, change.changed.sort()])).toEqual([
			['12 A - B', ['kick.wav', 'sb/bg.png']],
		]);
		expect(sent[0].entry?.info).toEqual({ id: 12 });

		writeLibrary('maps', '12 A - B', { 'map [Hard].osu': bytes('saved') }, undefined, true);
		expect(listLibrary('maps')[0].files.map(file => file.path)).toEqual(['map [Hard].osu']);

		sent.length = 0;
		fs.rmSync(path.join(root, 'skins', 'Mine'), { recursive: true });
		await settle();
		expect(sent).toEqual([{
			kind: 'skins', name: 'Mine', entry: undefined, changed: ['skin.ini'],
		}]);

		removeLibrary('maps', '12 A - B');
		await settle();
		expect(listLibrary('maps')).toEqual([]);
		expect(sent).toHaveLength(1);
	});
});
