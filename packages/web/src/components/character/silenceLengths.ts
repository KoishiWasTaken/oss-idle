/** The chat console's timeouts, offered again when silencing from a profile. */
export const SILENCE_LENGTHS: { label: string; seconds: number }[] = [
	{
		label: '10m', seconds: 600,
	},
	{
		label: '1h', seconds: 3600,
	},
	{
		label: '1d', seconds: 86400,
	},
	{
		label: '7d', seconds: 604800,
	},
	{
		label: '1mo', seconds: 2592000,
	},
	{
		label: '1y', seconds: 31536000,
	},
];
