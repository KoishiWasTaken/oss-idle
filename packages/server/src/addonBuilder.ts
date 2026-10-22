/**
 * Builds repo add-ons: claims a queued build from the API, builds the repository's
 * newest version tag (addonBuild.ts) and posts the result back.
 *
 * Runs apart from the API (home host), as its own unprivileged user, with its own
 * environment (never the API's .env): `npm -w @oss-idle/server run addon-builder`.
 * ADDON_BUILDER_API      the API origin, e.g. https://api.oss.idle.rhythmgamers.net
 * ADDON_BUILD_SECRET     the API's builder token
 * ADDON_BUILDER_NETWORK  Docker network for git + npm ci: internet only, it must drop
 *                        traffic to this host and the LAN (checked before every build)
 * ADDON_BUILDER_PROBES   more host:port the network must not reach, comma separated
 * ADDON_BUILDER_WORK     where builds happen: a size-capped filesystem (default tmpdir)
 */
import {
	buildAddon,
	checkIsolation,
	type Job,
} from './addonBuild';

const API = process.env.ADDON_BUILDER_API;
const SECRET = process.env.ADDON_BUILD_SECRET;
const POLL_MS = 30_000;

const api = (url: string, body?: unknown) => fetch(`${API}/v1/addons/builds/${url}`, {
	method: 'POST',
	headers: {
		Authorization: `Bearer ${SECRET}`,
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(body ?? {}),
});

const loop = async () => {
	for (;;) {
		try {
			const res = await api('claim');
			const { job } = res.ok ? await res.json() as { job?: Job } : {};
			if (!res.ok) console.error(`claim failed: ${res.status}`);
			if (job) {
				// not isolated: the claim goes stale and is handed out again later
				await checkIsolation();
				const result = await buildAddon(job);
				const sent = await api(String(job.id), result);
				console.log(`add-on ${job.id}: ${result.outcome}${sent.ok ? '' : ` (API ${sent.status})`}`);
				continue;
			}
		} catch (e) {
			console.error(e);
		}
		await new Promise(r => setTimeout(r, POLL_MS));
	}
};

if (!API || !SECRET) {
	console.error('ADDON_BUILDER_API and ADDON_BUILD_SECRET are required');
	process.exit(1);
}
void loop();
