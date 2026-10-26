import { hc } from 'hono/client';

import {
	edgeList,
	failoverFetch,
	json,
	onApiBaseChange,
	pickApiBase,
	withAuth,
} from '@oss-idle/shared/apiBase';

import type { AppType } from '@oss-idle/server';

export {
	json, unwrap, withAuth,
} from '@oss-idle/shared/apiBase';

/** API origin (or the edge measured nearest on an earlier load); empty in dev so
 *  requests go through the Vite proxy. Follows the page onto another origin when
 *  this one fails (a live binding). */
export let API_URL = pickApiBase(
	import.meta.env.VITE_API_URL ?? '',
	edgeList(import.meta.env.VITE_API_EDGES),
);
onApiBaseChange(base => {
	API_URL = base;
});

/** Resolve an API path (e.g. /v1/news) or stored media path to a full URL. */
export const apiUrl = (path: string): string =>
	/^https?:\/\//.test(path) ? path : `${API_URL}${path}`;

/** Send a credentialed request to an API path; JSON-encodes a body when given. */
export const send = (method: string, path: string, body?: unknown): Promise<Response> =>
	fetch(apiUrl(path), withAuth({
		method,
		headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	}));

/** Send a request and parse the JSON response in one step. */
export const request = <T>(method: string, path: string, body?: unknown): Promise<T> =>
	send(method, path, body).then(json<T>);

/**
 * Typed RPC client generated from the server's `AppType` - every route, its
 * params, and its return type are inferred from the server, so there are no
 * hand-written client types to keep in sync. Mirrors the game client's
 * `online/client.ts`; `AppType` is a type-only import, so no server runtime is
 * bundled.
 */
const apiFetch = failoverFetch((input, init) => fetch(input, withAuth(init)));
export const rpc = hc<AppType>(API_URL, { fetch: apiFetch });
