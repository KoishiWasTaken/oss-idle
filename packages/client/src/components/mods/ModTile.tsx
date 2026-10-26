import type { GlyphName } from '@oss-idle/shared/achievements/glyphs';

import Glyph from '../multiplayer/Glyph';

/** One mod on the mod select screen: lit while it's on. */
export default function ModTile({ glyph, label, short, on, disabled, tint, title, onClick }: {
	glyph: GlyphName,
	label: string,
	/** the rate, bottom left: a named mod already says what it is */
	short?: string,
	on: boolean,
	disabled: boolean,
	tint: string,
	title?: string,
	onClick: () => void,
}) {
	return (
		<button
			type="button"
			className={`mod-tile ${on ? 'is-on' : ''}`}
			style={{ '--tint': tint } as React.CSSProperties}
			disabled={disabled}
			title={title}
			onClick={onClick}
		>
			<Glyph name={glyph} className="mod-tile__glyph" />
			<span className="mod-tile__label">{label}</span>
			{short && <span className="mod-tile__short">{short}</span>}
		</button>
	);
}
