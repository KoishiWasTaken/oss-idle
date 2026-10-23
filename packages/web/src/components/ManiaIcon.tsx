/** The osu!mania ruleset's mark: a ring around three keys. */
export default function ManiaIcon() {
	return (
		<svg className='mania-icon' viewBox='0 0 16 16' width='1em' height='1em' aria-hidden>
			<circle cx='8' cy='8' r='7' fill='none' stroke='currentColor' strokeWidth='1.5' />
			<rect x='4.6' y='5' width='1.6' height='6' rx='0.8' fill='currentColor' />
			<rect x='7.2' y='3.5' width='1.6' height='9' rx='0.8' fill='currentColor' />
			<rect x='9.8' y='5' width='1.6' height='6' rx='0.8' fill='currentColor' />
		</svg>
	);
}
