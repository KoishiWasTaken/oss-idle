import { hc } from 'hono/client';

import {
	edgeList,
	failoverFetch,
	onApiBaseChange,
	pickApiBase,
	withAuth,
} from '@oss-idle/shared/apiBase';

import API from './api';

import type { AppType } from '@oss-idle/server';

export { withAuth };

/** The API origin, or the edge measured nearest on an earlier load; it follows
 *  the page onto another one when this one fails (a live binding). What it
 *  measured goes to the admin dashboard's latency by region. */
export let BASE_URL = pickApiBase(
	(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, ''),
	edgeList(import.meta.env.VITE_API_EDGES),
	measured => void fetch(`${BASE_URL}/v1/stats/rtt`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			samples: measured.map(({ base, ms }) => ({
				host: new URL(base).host, ms,
			})),
		}),
	}).catch(() => undefined),
);
onApiBaseChange(base => {
	BASE_URL = base;
});

/** An API path or stored media path as a full URL. */
export const apiUrl = (path: string): string =>
	/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;

/**
 * Typed RPC client generated from the server's `AppType`. Every route, its
 * params, and its return type are inferred from the server's route
 * definitions - there are no hand-written client types to keep in sync.
 *
 * Requests are routed through {@link API.fetch} so they keep the shared
 * retry/backoff, through {@link withAuth} for the cookie/Bearer session, and
 * through {@link failoverFetch} so they follow the page onto another origin.
 */
const apiFetch = failoverFetch((input, init) => API.fetch(input, withAuth(init)));
export const rpc = hc<AppType>(BASE_URL, { fetch: apiFetch });
