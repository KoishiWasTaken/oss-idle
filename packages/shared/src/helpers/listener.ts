import {
	useEffect,
	useRef,
} from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any) => unknown | void | Promise<void>;

export default class Listener<T extends Callback = (() => void)> {

	public static onError: (error: unknown) => void = e => console.error(e);

	protected callbacks = new Set<T>();
	/** the listeners as a trigger delivers to them, made again only when they change */
	private snapshot?: T[];

	public on(callback: T): () => void {
		this.callbacks.add(callback);
		this.snapshot = undefined;
		return () => this.off(callback);
	}

	public off(callback: T): void {
		this.callbacks.delete(callback);
		this.snapshot = undefined;
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
		// snapshot the listeners: a handler may swap scenes mid-dispatch (an awaited
		// callback lets React mount the next scene, which subscribes here), and a live
		// Set iteration would then deliver this same event to that just-added handler -
		// e.g. a back press bleeding result → select → menu in one tap. The snapshot is
		// kept until the listeners change: some fire every frame.
		const snapshot = this.snapshot ??= [...this.callbacks];
		for (let i = 0; i < snapshot.length; i++) {
			try {
				await snapshot[i](...args);
			} catch (e) {
				Listener.onError(e);
			}
		}
	}

}