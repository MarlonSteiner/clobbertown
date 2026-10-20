/**
 * The click-to-play overlay.
 *
 * This is not decoration. Browsers only grant pointer lock in response to a
 * user gesture, so the game cannot capture the mouse on load however much it
 * would like to. Since the overlay has to exist, it earns its keep by listing
 * the controls.
 *
 * It reappears whenever the lock is lost, because Escape releasing the pointer
 * is a browser behaviour that cannot be intercepted, and a game that keeps
 * running while the mouse is free feels broken.
 */
/**
 * Which of its three jobs the overlay is doing.
 *
 * They must look different from one another. When they did not, a player
 * who clicked during loading saw nothing happen, and a player who had paused
 * by accident saw what looked like the start screen again; both read as the
 * controls being broken.
 */
type OverlayState = 'loading' | 'ready' | 'paused';

export function StartScreen({
  onStart,
  hasPlayed,
  isReady,
}: {
  onStart: () => void;
  hasPlayed: boolean;
  isReady: boolean;
}) {
  const state: OverlayState = !isReady ? 'loading' : hasPlayed ? 'paused' : 'ready';

  return (
    // Clicking before the world exists would drop the player into an empty
    // sky, so the overlay stays put until physics is live.
    <div
      className="start-screen"
      data-state={state}
      onClick={state === 'loading' ? undefined : onStart}
    >
      <div className="start-card">
        <h1>Clobbertown</h1>
        {state === 'paused' ? (
          <p className="paused-badge">⏸ Paused</p>
        ) : (
          <p>A small town with a long memory.</p>
        )}

        <div className="controls">
          <span>
            <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
          </span>
          <span>Move</span>
          <span>Mouse</span>
          <span>Look around</span>
          <span>
            <kbd>Shift</kbd>
          </span>
          <span>Sprint</span>
          <span>
            <kbd>Space</kbd>
          </span>
          <span>Jump</span>
          <span>
            Click / <kbd>F</kbd>
          </span>
          <span>Punch</span>
          <span>
            <kbd>E</kbd>
          </span>
          <span>Talk to a resident</span>
          <span>
            <kbd>Esc</kbd>
          </span>
          <span>Release the mouse</span>
        </div>

        <CallToAction state={state} />
      </div>
    </div>
  );
}

function CallToAction({ state }: { state: OverlayState }) {
  if (state === 'loading') {
    return (
      <div className="cta cta-loading" role="status">
        <span className="spinner" aria-hidden="true" />
        Building the town…
      </div>
    );
  }

  return (
    <div className="cta cta-ready">
      {state === 'paused' ? '▶ Click to resume' : '▶ Click to play'}
    </div>
  );
}
