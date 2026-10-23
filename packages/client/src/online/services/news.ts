import type { InferResponseType } from 'hono/client';
import { rpc } from '../client';
import { unwrap } from '@oss-idle/shared/apiBase';
import MemCache from '@oss-idle/shared/storage/memcache';

const endpoint = rpc.v1.news;

/** The user shape returned by the API - inferred from the server, equals UserDTO. */
export type News = InferResponseType<typeof endpoint.latest.$get, 200>;

/**
 * Fetch a user by id. The return type is inferred end-to-end from the server
 * route, so it always matches the API's actual response with no duplication.
 */
export async function getLatest(): Promise<News> {
	return MemCache.get<News>('API.News.getLatest').process('latest', () =>
		unwrap<News>(endpoint.latest.$get()), 1000 * 300);
}
