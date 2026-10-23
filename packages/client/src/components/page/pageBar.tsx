import {
	createContext,
	type ReactNode,
} from 'react';
import { Trans } from '@lingui/react/macro';

export type PageAction = {
	id: string,
	label: ReactNode,
	onClick?: () => void,
	disabled?: boolean,
	/** Bar position; lower comes first. Defaults to 0. */
	order?: number,
	/** Render a non-interactive label instead of a button. */
	static?: boolean,
};

/** A page's bottom action-bar slot. Sub-views append their own actions into it
 *  (via PageBarActions) so they share the one real bottom bar. */
export const PageBarSlot = createContext<HTMLElement | null>(null);

type EditorBarOpts = {
	editing?: boolean,
	busy: boolean,
	canSave: boolean,
	onBack: () => void,
	onSave: () => void,
	viewActions?: PageAction[],
};

/** An editor view's bar: back/cancel, plus Save (edit) or the caller's view actions. */
export const editorBarActions = (o: EditorBarOpts): PageAction[] => {
	const back: PageAction = {
		id: 'back',
		label: o.editing ? <Trans>Cancel</Trans> : <Trans>Back</Trans>,
		onClick: o.onBack,
		disabled: o.busy,
		order: 10,
	};
	if (!o.editing) return [back, ...o.viewActions ?? []];
	const save: PageAction = {
		id: 'save',
		label: o.busy ? <Trans>Saving…</Trans> : <Trans>Save</Trans>,
		onClick: o.onSave,
		disabled: o.busy || !o.canSave,
		order: 20,
	};
	return [back, save];
};
