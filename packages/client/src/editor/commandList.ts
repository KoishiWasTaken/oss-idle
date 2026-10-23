import Synced from '@oss-idle/shared/helpers/synced';
import type {
	ActionContext,
	EditorAction,
} from './actions';

/** Whether the command list (Ctrl+K, or More) is open over the editor. */
export const commandListOpen = new Synced(false);

/** The action the command list is asking a value for, by id. */
export const commandAsking = new Synced<string | undefined>(undefined);

/** Open the command list on the action `id`'s question. */
export const askFor = (id: string): void => {
	void commandAsking.set(id);
	void commandListOpen.set(true);
};

/** Run `action`, or open the command list to ask for its value first. */
export const startAction = (action: EditorAction, context: ActionContext): void => {
	if (!action.ask) return action.run(context);
	askFor(action.id);
};
