/** The highest number `!roll [n]` may land on: 100 by default, at least 1. */
const rollMax = (arg: string | undefined): number => {
	const n = Number.parseInt(arg ?? '', 10);
	return Number.isNaN(n) ? 100 : Math.min(Math.max(n, 1), Number.MAX_SAFE_INTEGER);
};

const randomRoll = (max: number): number => Math.floor(Math.random() * max) + 1;

/** MakiseBot's answer to a chat line from `from`, or undefined when it isn't one of her commands. */
export const makiseBotReply = (
	text: string, from: string, roll = randomRoll,
): string | undefined => {
	const [command, arg] = text.trim().split(/\s+/);
	switch (command.toLowerCase()) {
		case '!roll': return `${from} rolls ${roll(rollMax(arg))} point(s)`;
		case '!ping': return 'pong';
		default: return undefined;
	}
};
