import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import HoverCard from '@oss-idle/shared/display/HoverCard';

type Props = {
	icon: IconDefinition;
	/** what it does, read out and shown on hover */
	label: string;
	onClick: () => void;
	on?: boolean;
	disabled?: boolean;
};

/** One of the dock's square controls: an icon, its name on hover. */
export default function DockIconButton({
	icon, label, onClick, on, disabled,
}: Props) {
	return (
		<HoverCard card={label}>
			<button
				type="button"
				className={`dock__icon ${on ? 'is-on' : ''}`}
				aria-label={label}
				aria-pressed={on}
				disabled={disabled}
				onClick={onClick}
			>
				<FontAwesomeIcon icon={icon} />
			</button>
		</HoverCard>
	);
}
