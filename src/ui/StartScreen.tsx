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
export function StartScreen({
  onStart,
  hasPlayed,
  isReady,
}: {
  onStart: () => void;
  hasPlayed: boolean;
  isReady: boolean;
}) {
  return (
    // Clicking before the world exists would drop the player into an empty
    // sky, so the overlay stays put until physics is live.
    <div className="start-screen" onClick={isReady ? onStart : undefined}>
      <div className="start-card">
        <h1>Clobbertown</h1>
        <p>{hasPlayed ? 'Paused' : 'A small town with a long memory.'}</p>

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
            <kbd>E</kbd>
          </span>
          <span>Talk to a resident</span>
          <span>
            <kbd>Esc</kbd>
          </span>
          <span>Release the mouse</span>
        </div>

        <p className="hint">
          {!isReady ? 'Building the town…' : hasPlayed ? 'Click to resume' : 'Click to play'}
        </p>
      </div>
    </div>
  );
}
