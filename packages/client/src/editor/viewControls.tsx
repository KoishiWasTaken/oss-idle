import '../components/options/controls/Slider.css';

import type {
	CSSProperties,
	ReactNode,
} from 'react';
/** The view tab's controls: a row of choices, a slider. */

export type Choice<T> = [T, string];

/** A row of buttons, the current one lit. */
export const choices = <T,>(options: Choice<T>[], value: T, pick: (value: T) => void) => (
	<span className='editor__divisors editor__toggle'>
		{options.map(([option, label]) => (
			<button
				key={String(option)}
				className={option === value ? 'is-active' : ''}
				onClick={() => pick(option)}
			>
				{label}
			</button>
		))}
	</span>
);

/** An on/off cell for a row of `.editor__switches`: its label over a switch. */
export const toggle = (label: ReactNode, on: boolean, set: (on: boolean) => void) => (
	<button
		type='button'
		role='switch'
		aria-checked={on}
		className={`editor__switch${on ? ' is-on' : ''}`}
		onClick={() => set(!on)}
	>
		<span className='ladder-sum__label'>{label}</span>
		<span className='editor__switch-track' aria-hidden />
	</button>
);

/** A cell like {@link toggle} that steps through `options` in turn, the first being off. */
export const cycle = <T,>(
	label: ReactNode,
	options: Choice<T>[],
	value: T,
	pick: (value: T) => void,
) => {
	const at = Math.max(0, options.findIndex(([option]) => option === value));
	return (
		<button
			type='button'
			className='editor__switch'
			onClick={() => pick(options[(at + 1) % options.length][0])}
		>
			<span className='ladder-sum__label'>{label}</span>
			<span className={`editor__cycle${at > 0 ? ' is-on' : ''}`}>{options[at][1]}</span>
		</button>
	);
};

/** A 0-100 slider, in steps of 10 from `min` up when `step` is given. */
export const slider = (
	value: number,
	set: (value: number) => void,
	label: string,
	min = 0,
	step = 1,
) => (
	<span className='editor__slider'>
		<input
			className='opt-slider__input'
			style={{ '--fill': `${(value - min) / (100 - min) * 100}%` } as CSSProperties}
			type='range'
			min={min}
			step={step}
			max={100}
			value={value}
			aria-label={label}
			onChange={e => set(Number(e.target.value))}
			// once dragged, the editor's keys are the editor's again
			onPointerUp={e => e.currentTarget.blur()}
		/>
		<span className='opt-slider__value'>{value}</span>
	</span>
);

/** A whole number field within [min, max], set on Enter or leaving it. */
export const whole = (
	value: number,
	min: number,
	max: number,
	set: (n: number) => void,
	label: string,
) => (
	<input
		className='editor__field editor__field--short'
		type='number'
		min={min}
		max={max}
		key={value}
		defaultValue={value}
		aria-label={label}
		onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
		onBlur={e => {
			const n = Math.round(Number(e.currentTarget.value));
			if (Number.isFinite(n)) set(Math.min(max, Math.max(min, n)));
		}}
	/>
);
