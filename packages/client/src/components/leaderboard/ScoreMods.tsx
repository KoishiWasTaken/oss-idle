import {
	playLabel,
	type Mod,
} from '@oss-idle/shared/mods';

/** A leaderboard row's mods, with its rate when it isn't x1. */
export default function ScoreMods({ rate, mods }: { rate: number, mods: Mod[] }) {
	return <span className="score_entry__mods">{playLabel(mods, rate) || '‎'}</span>;
}
