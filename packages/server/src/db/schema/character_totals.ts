import {
	bigint,
	int,
	mysqlTable,
} from 'drizzle-orm/mysql-core';
import { characters } from './character';
import {
	Grades,
	JUDGEMENT,
	Judgements,
	type Grade,
	type Judgement,
} from '@oss-idle/shared/judgement';
import { db } from '../client';
import {
	eq,
	sql,
} from 'drizzle-orm';
import { best } from './best';
import { beatmaps } from './beatmap';
import { scores } from './score';

const totalColumn = () => bigint({ mode: 'number' }).notNull().default(0);

const skillColumns = Judgements.reduce((acc, j) => {
	acc[j] = totalColumn();
	return acc;
}, {} as Record<Judgement, ReturnType<typeof totalColumn>>);

const gradesColumns = Grades.reduce((acc, j) => {
	acc[j] = totalColumn();
	return acc;
}, {} as Record<Grade, ReturnType<typeof totalColumn>>);


export const character_totals = mysqlTable('character_totals', {
	id: int().notNull()
		.references(() => characters.id, { onDelete: 'cascade' }),
	totalScore: totalColumn(),
	rankedScore: totalColumn(),
	hits: totalColumn(),
	playCount: totalColumn(),
	playTime: totalColumn(),
	...skillColumns,
	...gradesColumns,
});

export type CharacterTotalsRow = typeof character_totals.$inferSelect;
export type NewCharacterTotalsRow = typeof character_totals.$inferInsert;


/**
 * Recompute a character's totals from its scores and its bests, in one statement.
 * Kept as plain sums rather than updated by each play: a submit that stopped
 * halfway (a best saved, the totals not) would leave them wrong for good.
 */
export const refreshCharacterTotals = async (
	characterId: number,
	on: Pick<typeof db, 'execute'> = db,
) => {
	const hits = sql.join(
		Judgements.filter(j => j !== JUDGEMENT.MISS).map(j => sql`${scores[j]}`), sql` + `,
	);
	const all = Judgements.map(j => sql`, ${character_totals[j]} = p.${sql.raw(j)}`);
	const grades = Grades.map(g => sql`, ${character_totals[g]} = p.${sql.raw(`grade_${g}`)}`);
	await on.execute(sql`
		UPDATE ${character_totals},
			(
				SELECT COUNT(*) plays, COALESCE(SUM(${scores.score}), 0) total,
					COALESCE(SUM(${hits}), 0) hits,
					COALESCE(SUM(ROUND(${beatmaps.total_length} / 1000 / ${scores.rate})), 0) time
				FROM ${scores} LEFT JOIN ${beatmaps} ON ${beatmaps.id} = ${scores.beatmapId}
				WHERE ${scores.characterId} = ${characterId}
			) a,
			(
				SELECT COALESCE(SUM(${best.score}), 0) ranked
					${sql.join(Judgements.map(j => sql`, COALESCE(SUM(${best[j]}), 0) ${sql.raw(j)}`))}
					${sql.join(Grades.map(g => sql`, COALESCE(SUM(${best.grade} = ${g}), 0) ${sql.raw(`grade_${g}`)}`))}
				FROM ${best} WHERE ${best.characterId} = ${characterId}
			) p
		SET ${character_totals.playCount} = a.plays, ${character_totals.totalScore} = a.total,
			${character_totals.hits} = a.hits, ${character_totals.playTime} = a.time,
			${character_totals.rankedScore} = p.ranked
			${sql.join(all)} ${sql.join(grades)}
		WHERE ${character_totals.id} = ${characterId}
	`);
};

export const getCharacterTotals = async (characterId: number) => {
	const read = () => db
		.select()
		.from(character_totals)
		.where(eq(character_totals.id, characterId))
		.limit(1);
	let [row] = await read();
	if (!row) {
		await db.insert(character_totals).values({ id: characterId });
		await refreshCharacterTotals(characterId);
		[row] = await read();
		if (!row) throw new Error('Could not insert character totals ! ' + characterId);
	}
	return row;
};
