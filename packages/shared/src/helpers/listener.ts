import {
	useEffect,
	useRef,
} from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any) => unknown | void | Promise<void>;

export default class Listener<T extends Callback = (() => void)> {

	public static onError: (error: unknown) => void = e => console.error(e);

	protected callbacks = new Set<T>();

	/** Stable list of callbacks to avoid shifts when triggering them */
	private stableCallbacks?: T[];

	public on(callback: T): () => void {
		this.callbacks.add(callback);
		this.stableCallbacks = undefined;
		return () => this.off(callback);
	}

	public off(callback: T): void {
		this.callbacks.delete(callback);
		this.stableCallbacks = undefined;
	}

	/**
	 * React hook: subscribe `callback` for this component's lifetime, auto-removing
	 * it on unmount. The latest `callback` is always invoked (kept in a ref) so the
	 * subscription is set up once and never goes stale - no deps to manage.
	 */
	public use(callback: T): void {
		const ref = useRef(callback);
		ref.current = callback;
		useEffect(() => 
			this.on(((...args: Parameters<T>) => 
				ref.current(...args)) as T), [this]);
	}

	public async trigger(...args: Parameters<T>): Promise<void> {
		const stableCallbacks = this.stableCallbacks ??= [...this.callbacks];

		for (let i = 0; i < stableCallbacks.length; i++) {
			try {
				await stableCallbacks[i](...args);
			} catch (e) {
				Listener.onError(e);
			}
		}
	}

}