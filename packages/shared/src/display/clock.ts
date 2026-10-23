/** A timestamp as local 24-hour HH:mm. */
const clock = (at: number): string => {
	const d = new Date(at);
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default clock;
