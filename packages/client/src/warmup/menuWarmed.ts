/** Settles once the main menu has been drawn once, hidden (see MenuWarmup): the intro
 *  starts after it, so the GPU's first compile of the menu happens before anything moves. */
let settle = () => {};
export const menuWarmed = new Promise<void>(resolve => { settle = resolve; });
export const warmedUp = () => settle();
