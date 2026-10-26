import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import {
	characters,
	resolveAvatarUrl,
} from './db/schema/character';
import { users } from './db/schema/user';
import { groupsByUser } from './groups';
import { globalRanks } from './rankings';
import { selectedRuleset } from './rulesets/registry';
import { areOnline } from './ws/presence';

type CardRow = {
	userId: number;
	country: string;
	lastActiveAt: Date | null;
	userAvatarUrl: string | null;
	character: { id: number; name: string; avatarUrl: string | null; ruleset: RulesetId };
};

/** What playerCards needs, selected from users joined on their current character. */
export const cardColumns = {
	userId: users.id,
	country: users.country,
	lastActiveAt: users.lastActiveAt,
	userAvatarUrl: users.avatarUrl,
	character: {
		id: characters.id,
		name: characters.name,
		avatarUrl: characters.avatarUrl,
		ruleset: characters.ruleset,
	},
};

/** Each player's global pp rank in the ruleset they picked, one round trip per ruleset. */
const rankInPicked = async (rows: CardRow[]): Promise<(number | undefined)[]> => {
	const ranks: (number | undefined)[] = [];
	const byRuleset = Map.groupBy(rows.map((r, i) => ({
		r, i, 
	})), ({ r }) => selectedRuleset(r.character));
	for (const [ruleset, picked] of byRuleset) {
		const found = await globalRanks(ruleset, 'pp', picked.map(({ r }) => r.character.id));
		picked.forEach(({ i }, k) => ranks[i] = found[k]);
	}
	return ranks;
};

/** osu!web's user list entries (friends, a group): presence, global rank and groups. */
export const playerCards = async (rows: CardRow[]) => {
	const ids = rows.map(r => r.character.id);
	const [online, ranks, groups] = await Promise.all([
		areOnline(ids), rankInPicked(rows), groupsByUser(rows.map(r => r.userId)),
	]);
	return rows.map((r, i) => ({
		userId: r.userId,
		groups: groups.get(r.userId)!,
		online: online[i],
		lastActiveAt: r.lastActiveAt?.toISOString(),
		character: {
			id: r.character.id,
			name: r.character.name,
			avatarUrl: resolveAvatarUrl(r.character.avatarUrl, r.userAvatarUrl),
			country: r.country,
			rank: ranks[i],
		},
	}));
};
