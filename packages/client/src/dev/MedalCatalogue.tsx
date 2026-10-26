import '../components/medals/medals.css';

import { MedalCategories } from '@oss-idle/shared/achievements/catalogue';
import { medalTierName } from '@oss-idle/shared/display/medals';
import { MEDAL_XP_BONUS } from '@oss-idle/shared/upgrades';

import MedalBadge from '../components/medals/MedalBadge';
import { selectedDef } from '../rulesets/registry';
import { medalSamples } from './medalSamples';

/** Playground-only sheet of every medal, for reviewing the list. */
export default function MedalCatalogue() {
	const samples = medalSamples();
	return <div className="medal-catalogue">
		{MedalCategories.map(category => <section key={category}>
			<h2>{category} ({selectedDef().medals.medals.filter(m => m.category === category).length})</h2>
			<div className="medal-catalogue__grid">
				{samples
					.filter((_, i) => selectedDef().medals.medals[i].category === category)
					.map(medal => <div key={medal.id} className={`medal-catalogue__item tier-${medal.look.tier}`}>
						<MedalBadge look={medal.look} />
						<div>
							<div className="medal-catalogue__name">{medal.name}</div>
							<div className="medal-catalogue__tier">
								{medalTierName(medal.look.tier)} · +{MEDAL_XP_BONUS[medal.look.tier] * 100}% XP
							</div>
							<div className="medal-catalogue__description">{medal.description}</div>
						</div>
					</div>)}
			</div>
		</section>)}
	</div>;
}
