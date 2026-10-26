import { desktop } from '@oss-idle/shared/desktop';

import { flash } from './flash';

/**
 * Staging app: Ctrl+Shift+F12 (away from GPU overlays' Alt keys) has the desktop shell
 * record up to ten seconds of Chromium's own frame pipeline (packages/desktop/src/trace.ts)
 * - the frames the compositor or the GPU dropped, which the profiler can't see - and
 * send it beside the profiler's reports. Pressed again, it sends what it has.
 */

let recording = false;

/** Start a trace, or send the one being recorded now. */
export function trace(): void {
	const record = desktop()?.trace;
	if (!record) return;
	if (recording) {
		flash('Sending the trace...');
		void record();
		return;
	}
	recording = true;
	flash('Tracing for 10 seconds (Ctrl+Shift+F12 to send it now)');
	void record().then(result => {
		recording = false;
		flash(`Trace ${result}`);
	});
}

window.addEventListener('keydown', e => {
	if (e.key !== 'F12' || !e.ctrlKey || !e.shiftKey) return;
	e.preventDefault();
	trace();
}, { capture: true });
