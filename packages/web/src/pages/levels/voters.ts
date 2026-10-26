import type { LevelVoteRow } from '../../api/levelVotes';
import { median } from './levelScale';

/** One player's votes on a map, and how far the furthest is from that skill's median. */
export type Voter = {
	userId: number,
	name: string,
	characterId?: number,
	restricted: boolean,
	levels: Record<string, number>,
	offset: number,
};

/** The votes by player, furthest from the medians first: trolls float to the top. */
export const votersOf = (rows: LevelVoteRow[]): Voter[] => {
	const bySkill = Map.groupBy(rows, row => row.skill);
	const medians = new Map([...bySkill]
		.map(([skill, votes]) => [skill, median(votes.map(v => v.level))!]));
	return [...Map.groupBy(rows, row => row.userId).values()]
		.map(votes => ({
			userId: votes[0]!.userId,
			name: votes[0]!.name ?? votes[0]!.username ?? `#${votes[0]!.userId}`,
			characterId: votes[0]!.characterId ?? undefined,
			restricted: !!votes[0]!.restrictedAt,
			levels: Object.fromEntries(votes.map(v => [v.skill, v.level])),
			offset: Math.max(...votes.map(v => Math.abs(v.level - medians.get(v.skill)!))),
		}))
		.sort((a, b) => b.offset - a.offset);
};
