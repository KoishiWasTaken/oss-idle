import type { ReactNode } from 'react';

/** One part of a skill's XP equation: what it is over what it gives. */
export default function SkillChip({
	label,
	value,
	base,
	kind = '',
}: {
	label: ReactNode,
	value: string,
	/** changes nothing yet: dimmed */
	base?: boolean,
	kind?: string,
}) {
	return (
		<span className={`skill-chip ${kind} ${base ? 'is-base' : ''}`}>
			<small>{label}</small><span>{value}</span>
		</span>
	);
}
