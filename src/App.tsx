import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA } from './config/tuning';
import { useAttackClick } from './input/useAttackClick';
import { useKeyboard } from './input/useKeyboard';
import { useMouseLook } from './input/useMouseLook';
import { usePointerLock } from './input/usePointerLock';
import { Game } from './scene/Game';
import { useGameStore } from './state/useGameStore';
import { Hud } from './ui/Hud';
import { StartScreen } from './ui/StartScreen';

/**
 * Composes the game: one canvas, the HTML drawn over it, and the input that
 * feeds both.
 *
 * Input hooks live out here rather than inside the Canvas because they listen
 * on the window and need the canvas element itself for pointer lock. The refs
 * they own are handed down, so there is exactly one source of input.
 */
export function App() {
  // State rather than a ref, because the input hooks must re-run once the
  // canvas element exists; a ref would not notify them.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  /**
   * Whether the game is accepting input. This is deliberately not the same as
   * "the pointer is locked": the player presses play to start, and only losing
   * a lock they had stops them. Tying the two together would leave the game
   * unplayable wherever pointer lock is refused.
   */
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const isWorldReady = useGameStore((state) => state.isWorldReady);

  const input = useKeyboard();
  const look = useMouseLook(canvas);
  useAttackClick(canvas, input);

  const pause = useCallback(() => setIsPlaying(false), []);
  const { requestLock } = usePointerLock(canvas, pause);

  const startPlaying = () => {
    if (!isWorldReady) return;
    setHasPlayed(true);
    setIsPlaying(true);
    requestLock();
  };

  return (
    <>
      <Canvas
        ref={setCanvas}
        shadows
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far }}
        // Capped so a high-DPI display does not quietly render four times the
        // pixels and halve the frame rate.
        dpr={[1, 2]}
      >
        <Game input={input} look={look} paused={!isPlaying} />
      </Canvas>

      {isPlaying ? (
        <Hud />
      ) : (
        <StartScreen onStart={startPlaying} hasPlayed={hasPlayed} isReady={isWorldReady} />
      )}
    </>
  );
}
