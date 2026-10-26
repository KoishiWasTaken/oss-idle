import {
	mapped,
	type ValueIn,
} from '../../helpers/mapped.js';

export const Judgements = [
	'DIVINE', 'MARVELOUS', 'PERFECT', 'GREAT', 'GOOD', 'BAD', 'MISS',
] as const;
export const JUDGEMENT = mapped(Judgements);
export type Judgement = ValueIn<typeof JUDGEMENT>;
