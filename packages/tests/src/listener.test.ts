import {
	describe,
	expect,
	it,
} from 'vitest';

import Listener from '@oss-idle/shared/helpers/listener';

describe('Listener', () => {
	it('delivers to the listeners there were when it fired, and sees changes on the next', async () => {
		const listener = new Listener();
		const calls: string[] = [];
		const late = () => void calls.push('late');
		const offA = listener.on(() => {
			calls.push('a');
			listener.on(late);
		});
		await listener.trigger();
		expect(calls).toEqual(['a']);

		offA();
		await listener.trigger();
		expect(calls).toEqual(['a', 'late']);
	});
});
