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
	if (value >= 1e9) return `${(value / 1e9).toFixed(1)} GB`;
	if (value >= 1e6) return `${(value / 1e6).toFixed(0)} MB`;
	return `${Math.round(value / 1e3)} KB`;
};

export { default as clock } from '@oss-idle/shared/display/clock';
