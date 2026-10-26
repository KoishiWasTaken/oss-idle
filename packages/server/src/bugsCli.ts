import 'dotenv/config';

import {
	BUG_STATUS,
	type BugStatus,
} from '@oss-idle/shared/bugs';
import { OWNER_ID } from '@oss-idle/shared/groups';

import {
	addBugMessage,
	allBugs,
	bugStatuses,
	getBug,
} from './bugs';
import { apiBaseUrl } from './env';
import { redis } from './redis';

const USAGE = `bugs list [open,confirmed,fixed,closed|all]   (default: all but closed)
bugs show <id>
bugs reply <id> <text>                 (posted as Adri)
bugs status <id> <status> [text]`;

const day = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');

const isStatus = (s: string): s is BugStatus => (BUG_STATUS as readonly string[]).includes(s);

const name = (who: { userId: number; name: string | null }) => who.name ?? `user ${who.userId}`;

const list = async (filter?: string) => {
	for (const r of await allBugs(bugStatuses(filter))) {
		const waiting = r.lastByTeam ? '' : '  * awaiting reply';
		console.log(`#${r.id} [${r.status}] ${day(r.updatedAt)} ${r.title}`
			+ ` - ${name(r.reporter)}, ${r.version}${waiting}`);
	}
};

const show = async (id: number) => {
	const r = await getBug(id);
	if (!r) throw new Error(`No report #${id}`);
	console.log(`#${r.id} ${r.title}\nstatus: ${r.status}`);
	const { userId, characterId } = r.reporter;
	console.log(`by: ${name(r.reporter)} (user ${userId}, character ${characterId})`);
	console.log(`version: ${r.version}\nclient: ${r.client}\nsetup: ${r.setup}`);
	console.log(`opened: ${day(r.createdAt)}`);
	for (const m of r.messages) {
		const who = `${name(m.author)}${m.team ? ' (team)' : ''}`;
		console.log(`\n--- ${day(m.createdAt)} ${who}${m.status ? ` set status ${m.status}` : ''}`);
		if (m.body) console.log(m.body);
		for (const image of m.images) console.log(`[image] ${apiBaseUrl}${image}`);
	}
};

const post = async (id: number, body: string, status?: BugStatus) => {
	if (!await getBug(id)) throw new Error(`No report #${id}`);
	await addBugMessage(id, OWNER_ID, {
		body, status,
	});
	await show(id);
};

const main = async () => {
	const [cmd, a, b, ...rest] = process.argv.slice(2);
	const id = Number(a);
	if (cmd === 'list') return list(a);
	if (cmd === 'show' && id) return show(id);
	if (cmd === 'reply' && id && b) return post(id, [b, ...rest].join(' '));
	if (cmd === 'status' && id && b && isStatus(b)) return post(id, rest.join(' '), b);
	console.log(USAGE);
};

// the quit sends the reply's socket push before leaving
main().then(async () => {
	await redis.quit();
	process.exit(0);
}, (e: Error) => {
	console.error(e.message);
	process.exit(1);
});
