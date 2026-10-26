/** A teardown; running it undoes what returned it. */
export type Disposer = () => void;

/** What an add-on registers, so it all goes when the editor closes or the add-on stops. */
export class Owned {

	private readonly disposers = new Set<Disposer>();

	public own(dispose: Disposer): Disposer {
		const once = () => {
			if (this.disposers.delete(once)) dispose();
		};
		this.disposers.add(once);
		return once;
	}

	public release(): void {
		for (const dispose of [...this.disposers]) dispose();
	}

}
