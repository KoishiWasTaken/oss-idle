import sum from '../../helpers/sum.js';
import { Judgements } from './judgement.js';
import { ACCURACY } from './scoring.js';

const hitAccuracy = (totals: Readonly<Record<string, number>>) =>
	sum(Judgements.map(j => ACCURACY[j] * totals[j]))
			/ Math.max(1, sum(Judgements.map(j => totals[j])));

export default hitAccuracy;