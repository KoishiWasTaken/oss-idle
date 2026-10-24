import {
	describe,
	expect,
	it,
} from 'vitest';
import { renderProfileCard } from '../../server/src/profileCard';

describe('profile card', () => {
	it('draws a 1200×630 PNG even when the avatar cannot be fetched', async () => {
		const png = await renderProfileCard({
			name: '<Adri & co>',
			title: 'overall-75',
			avatarUrl: 'http://127.0.0.1:9/none.png',
			country: 'XX',
			groups: ['admin', 'gmt'],
			pp: 1234.5,
			playCount: 0,
		});
		expect(png.subarray(1, 4).toString()).toBe('PNG');
		expect(png.readUInt32BE(16)).toBe(1200);
		expect(png.readUInt32BE(20)).toBe(630);
	});
});
