import {
	describe,
	it,
	expect,
	vi,
} from 'vitest';
import { remountAddon } from '@oss-idle/client/addons/runtime';
import type { Addon } from '@oss-idle/client/db/schema/addon';

vi.mock('@oss-idle/client/globals', () => ({ message: { set: () => {} } }));
vi.mock('@oss-idle/client/db/schema/addon', () => ({ Addon: class {} }));

// node cannot import blob: URLs; hand the runtime a data: URL of the same source
vi.stubGlobal('Blob', class { constructor(readonly parts: string[]) {} });
vi.stubGlobal('URL', Object.assign(URL, {
	createObjectURL: (b: { parts: string[] }) => `data:text/javascript,${encodeURIComponent(b.parts.join(''))}`,
	revokeObjectURL: () => {},
}));

const log: string[] = (globalThis as { addonLog?: string[] }).addonLog = [];

const addon = (source: string) => ({
	id: 1, name: 'test', enabled: true, source,
}) as Addon;

describe('remountAddon', () => {
	it('finishes the old version\'s teardown before mounting the new one', async () => {
		// the SDK's unmount before it returned its teardown: microtasks, no promise
		await remountAddon(addon(`
			export const mount = () => addonLog.push('old mounted');
			export const unmount = () => {
				Promise.resolve().then(() => Promise.resolve()).then(() => addonLog.push('old unmounted'));
			};
		`));
		await remountAddon(addon(`
			export const mount = () => addonLog.push('new mounted');
			export const unmount = () => new Promise(r => setTimeout(r, 20))
				.then(() => addonLog.push('new unmounted'));
		`));
		await remountAddon(addon('export const mount = () => addonLog.push(\'newer mounted\');'));
		expect(log).toEqual([
			'old mounted', 'old unmounted', 'new mounted', 'new unmounted', 'newer mounted',
		]);
	});
});
