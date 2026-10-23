import {
	and,
	countDistinct,
	desc,
	eq,
	getTableColumns,
} from 'drizzle-orm';
import { db } from '../db/client';
import { beatmaps } from '../db/schema/beatmap';
import { beatmapset } from '../db/schema/beatmapset';
import { profilePage } from '../db/profilePage';
import {
	listCondition,
	listedAt,
	panelColumns,
} from './catalog';

/** Which of a user's own maps: the ranked ones they mapped, or their unranked uploads. */
export type MappedStatus = 'ranked' | 'unranked';

const mappedCondition = (userId: number, status: MappedStatus) =>
	and(eq(beatmapset.ownerUserId, userId), listCondition(status));

export const countMapped = async (userId: number, status: MappedStatus) => {
	const [row] = await db.select({ n: countDistinct(beatmapset.id) })
		.from(beatmapset)
		.innerJoin(beatmaps, eq(beatmapset.id, beatmaps.setId))
		.where(mappedCondition(userId, status));
	return row?.n ?? 0;
};

/** A user's own maps of a status, latest ranked or uploaded first. */
export const getMapped = (userId: number, status: MappedStatus, page: number) =>
	profilePage(page, (offset, limit) => db
		.select({
			...getTableColumns(beatmapset),
			...panelColumns(),
		})
		.from(beatmapset)
		.innerJoin(beatmaps, eq(beatmapset.id, beatmaps.setId))
		.where(mappedCondition(userId, status))
		.groupBy(beatmapset.id)
		.orderBy(desc(listedAt), desc(beatmapset.id))
		.offset(offset)
		.limit(limit));
