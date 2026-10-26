import {
	rpc,
	unwrap,
} from './client';

/** Public: the calibration maps with every vote, and the viewer's own. */
export const listLevelMaps = () => unwrap(rpc.v1.beatmap.levels.$get());

export type LevelMap = Awaited<ReturnType<typeof listLevelMaps>>[number];

const skillParam = (beatmapId: number, skill: string) => ({
	param: {
		beatmapId: String(beatmapId), skill,
	},
});

/** Vote the level a skill needs on a map, replacing your earlier vote. */
export const voteLevel = (beatmapId: number, skill: string, level: number) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'][':skill'].$put({
		...skillParam(beatmapId, skill), json: { level },
	}));

/** Take your vote back. */
export const clearLevelVote = (beatmapId: number, skill: string) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'][':skill'].$delete(skillParam(beatmapId, skill)));

/** Admin: live difficulties not listed yet. */
export const searchLevelMaps = (q: string) =>
	unwrap(rpc.v1.beatmap.levels.search.$get({ query: { q } }));

export type LevelMapHit = Awaited<ReturnType<typeof searchLevelMaps>>[number];

/** Admin: list a difficulty. */
export const addLevelMap = (beatmapId: number) =>
	unwrap(rpc.v1.beatmap.levels.$post({ json: { beatmapId } }));

/** Admin: the skills nobody votes on for a map, and the result its votes are for. */
export const updateLevelMap = (
	beatmapId: number,
	patch: { disabled?: string[], target?: string },
) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'].$patch({
		param: { beatmapId: String(beatmapId) }, json: patch,
	}));

/** Admin: take a map off; its votes are kept. */
export const removeLevelMap = (beatmapId: number) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'].$delete({ param: { beatmapId: String(beatmapId) } }));

/** Moderators: every vote on a map, with who cast it. */
export const listLevelVotes = (beatmapId: number) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'].votes.$get({ param: { beatmapId: String(beatmapId) } }));

export type LevelVoteRow = Awaited<ReturnType<typeof listLevelVotes>>[number];

/** Moderators: drop one player's votes on a map. */
export const removeVoterVotes = (beatmapId: number, userId: number) =>
	unwrap(rpc.v1.beatmap.levels[':beatmapId'].votes[':userId'].$delete({
		param: {
			beatmapId: String(beatmapId), userId: String(userId),
		},
	}));

/** Moderators: drop one player's votes on every map. */
export const removeVoterEverywhere = (userId: number) =>
	unwrap(rpc.v1.beatmap.levels.votes[':userId'].$delete({ param: { userId: String(userId) } }));
