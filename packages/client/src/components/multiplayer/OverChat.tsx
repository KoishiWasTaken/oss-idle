import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import {
	KeyboardLayer,
	LAYER,
} from '../../input/keyboardOwner';

const OVER_CHAT = {
	layer: LAYER.OVER_CHAT, open: true, 
};

/** osu!'s multiplayer dialogs cover the whole screen, chat included. */
export default function OverChat({ children }: { children: ReactNode }) {
	return createPortal(
		<KeyboardLayer.Provider value={OVER_CHAT}>
			<div className="mp-over-chat">{children}</div>
		</KeyboardLayer.Provider>,
		document.body,
	);
}
