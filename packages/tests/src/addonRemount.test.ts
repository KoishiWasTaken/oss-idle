import {
	describe,
	expect,
	it,
	vi,
} from 'vitest';

import {
	allowsUpdate,
	remountAddon,
} from '@oss-idle/client/addons/runtime';
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

describe('allowsUpdate', () => {
	it('asks the running add-on; one without canUpdate, or a broken one, may restart', async () => {
		const busy = {
			...addon('export const canUpdate = async () => !globalThis.addonBusy;'), id: 2, 
		} as Addon;
		await remountAddon(busy);
		(globalThis as { addonBusy?: boolean }).addonBusy = true;
		expect(await allowsUpdate(2)).toBe(false);
		(globalThis as { addonBusy?: boolean }).addonBusy = false;
		expect(await allowsUpdate(2)).toBe(true);

		await remountAddon({
			...addon('export const canUpdate = () => { throw new Error(); };'), id: 3, 
		} as Addon);
		expect(await allowsUpdate(3)).toBe(true);
		expect(await allowsUpdate(99)).toBe(true);
	});
});
