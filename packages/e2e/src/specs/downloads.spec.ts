import {
	expect,
	test,
} from '../support/fixtures';
import {
	query,
	REDIS_PREFIX,
	redisClient,
	testAccounts,
	type Account,
} from '../support/accounts';

/** A non-supporter's sets past the day's 100 full-speed ones still download, slower. */
test.describe('daily full-speed downloads', () => {
	let sam: Account;

	test.beforeAll(async () => {
		[sam] = await testAccounts('downloads');
	});

	test.afterAll(async () => {
		await query('UPDATE user SET created_at = NOW(), supporter_until = NULL WHERE id = ?', [sam.id]);
	});

	test('past 100 a day downloads slow down, except on signup day and for supporters', async ({
		playerAs,
	}) => {
		const page = await playerAs(sam);
		const catalog = await (await page.request.get('/v1/beatmap/catalog')).json() as {
			beatmaps: { id: number, size: number }[],
		};
		const [small, counted] = catalog.beatmaps.toSorted((a, b) => a.size - b.size);

		// the day's 100, one of them a real set
		const redis = redisClient();
		const key = `${REDIS_PREFIX}fastdl:user:${sam.id}:${Math.floor(Date.now() / 86_400_000)}`;
		try {
			await redis.del(key);
			await redis.sadd(key, String(counted.id), ...Array.from({ length: 99 }, (_, i) => String(-1 - i)));
		} finally {
			redis.disconnect();
		}
		const rate = async (id: number) => {
			const res = await page.request.get(`/v1/beatmap/osz/${id}`);
			expect(res.status()).toBe(200);
			return res.headers()['x-download-rate'];
		};
		const account = (sql: string) => query(`UPDATE user SET ${sql} WHERE id = ?`, [sam.id]);

		await account('created_at = NOW() - INTERVAL 2 DAY, supporter_until = NULL');
		expect(await rate(small.id)).toBe('reduced');
		expect(await rate(counted.id)).toBeUndefined();

		await account('created_at = NOW() - INTERVAL 1 HOUR');
		expect(await rate(small.id)).toBeUndefined();

		await account('created_at = NOW() - INTERVAL 2 DAY, supporter_until = NOW() + INTERVAL 1 DAY');
		expect(await rate(small.id)).toBeUndefined();
	});
});
