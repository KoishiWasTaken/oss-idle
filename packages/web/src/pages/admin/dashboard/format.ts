/** The dashboard's number formats. */

export const ms = (value: number | undefined | null) => {
	if (value === undefined || value === null) return '-';
	return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
};

export const num = (value: number | undefined) => {
	if (value === undefined) return '-';
	if (value >= 10_000) return `${(value / 1000).toFixed(0)}K`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return `${Math.round(value * 10) / 10}`;
};

export const pct = (value: number | undefined, digits = 1) =>
	value === undefined || !Number.isFinite(value) ? '-' : `${(value * 100).toFixed(digits)}%`;

export const bytes = (value: number) => {
	if (value >= 1e12) return `${(value / 1e12).toFixed(2)} TB`;
	if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e11 ? 0 : 1)} GB`;
	if (value >= 1e6) return `${(value / 1e6).toFixed(0)} MB`;
	return `${Math.round(value / 1e3)} KB`;
};

/** A timestamp as e.g. "26 Oct, 14:00". */
export const dayClock = (at: number) => new Date(at).toLocaleString('en-GB', {
	day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

/** When the disk fills at its recent pace, from the dashboard's disk report. */
export const fullIn = (disk: { freePerDay?: number; fullAt?: number } | undefined) => {
	if (disk?.freePerDay === undefined) return '-';
	if (disk.fullAt === undefined) return 'Not filling';
	const days = (disk.fullAt - Date.now()) / 86_400_000;
	return days < 2 ? `${Math.max(0, Math.round(days * 24))} h` : `${Math.round(days)} days`;
};

export { default as clock } from '@oss-idle/shared/display/clock';
