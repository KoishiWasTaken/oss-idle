/** Song time as m:ss.mmm. */
export const clock = (ms: number): string => {
	const total = Math.max(0, Math.floor(ms));
	const minutes = Math.floor(total / 60000);
	const seconds = Math.floor(total / 1000) % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}.${String(total % 1000).padStart(3, '0')}`;
};
