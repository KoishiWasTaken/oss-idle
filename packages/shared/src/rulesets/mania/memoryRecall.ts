/** Plays each memory upgrade forgets. */
export const FORGET_PLAYS = 10;

/** Plays that still train memory, from a map's play times and the times memory
 *  upgrades were bought (each forgets {@link FORGET_PLAYS}). */
export const recall = (playedAt: readonly number[], forgetAt: readonly number[]): number => {
	const events = [
		...playedAt.map(t => ({
			t, forget: false,
		})),
		...forgetAt.map(t => ({
			t, forget: true,
		})),
	].sort((a, b) => a.t - b.t);
	let plays = 0;
	for (const e of events) {
		plays = e.forget ? Math.max(0, plays - FORGET_PLAYS) : plays + 1;
	}
	return plays;
};
