/** The osu! (standard) ruleset's mark: a ring around a hit circle. */
export default function OsuIcon() {
	return (
		<svg className='mania-icon' viewBox='0 0 16 16' width='1em' height='1em' aria-hidden>
			<circle cx='8' cy='8' r='7' fill='none' stroke='currentColor' strokeWidth='1.5' />
			<circle cx='8' cy='8' r='3.2' fill='currentColor' />
		</svg>
	);
}
