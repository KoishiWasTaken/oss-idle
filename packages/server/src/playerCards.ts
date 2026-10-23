import { groupsByUser } from './groups';
import {
	characters,
	resolveAvatarUrl,
} from './db/schema/character';
import { users } from './db/schema/user';
import { areOnline } from './ws/presence';
import { globalRanks } from './rankings';

type CardRow = {
	userId: number;
	country: string;
	lastActiveAt: Date | null;
	userAvatarUrl: string | null;
	character: { id: number; name: string; avatarUrl: string | null };
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
	},
};

/** osu!web's user list entries (friends, a group): presence, global rank and groups. */
export const playerCards = async (rows: CardRow[]) => {
	const ids = rows.map(r => r.character.id);
	const [online, ranks, groups] = await Promise.all([
		areOnline(ids), globalRanks('pp', ids), groupsByUser(rows.map(r => r.userId)),
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
