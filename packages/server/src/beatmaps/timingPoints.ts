/** Red (bpm) and green (sv) line counts in a .osu's [TimingPoints], to help tag a diff. */
export const countTimingPoints = (osu: string): { bpm: number, sv: number } => {
	const counts = {
		bpm: 0, sv: 0, 
	};
	const section = osu.split(/^\[TimingPoints\]\s*$/m)[1]?.split(/^\[/m)[0] ?? '';
	for (const line of section.split(/\r?\n/)) {
		const f = line.split(',');
		if (f.length < 2) continue;
		// v5- lines have no `uninherited` field: a negative beat length is a green line.
		const red = f[6] !== undefined ? f[6].trim() === '1' : Number(f[1]) >= 0;
		counts[red ? 'bpm' : 'sv']++;
	}
	return counts;
};

export const timingColumns = (chart: string) => {
	const { bpm, sv } = countTimingPoints(chart);
	return {
		bpmPoints: bpm, svPoints: sv, 
	};
};
