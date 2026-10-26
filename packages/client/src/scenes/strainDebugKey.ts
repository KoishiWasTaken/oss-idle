/** Dev-only: the diff id the strain debug overlay is open on, stashed in
 *  sessionStorage so a full dev-server reload (a skill edit forces one) reopens
 *  it instead of dropping back to the intro. See SceneManager's boot. */
export const STRAIN_DEBUG_KEY = 'strain-debug-diff';
