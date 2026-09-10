import { PALETTE } from '../config/palette';
import { WORLD } from '../config/tuning';

/** Where the sun sits. High and off to one side, so buildings cast readable shadows. */
const SUN_POSITION: [number, number, number] = [40, 60, 25];

/**
 * A single directional sun plus a strong ambient fill.
 *
 * Flat, cheerful lighting is what sells the toy-town look; a physically
 * plausible setup would put half the scene in shadow and read as gloomy.
 * The ambient term is high on purpose so shadowed faces stay colourful.
 */
export function Lighting() {
  // The shadow camera is an orthographic box that must contain everything
  // meant to cast a shadow. Sized to the town, with headroom for tall roofs.
  const extent = WORLD.size * 0.7;

  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      {/* Fog hides the hard edge where the ground slab ends. */}
      <fog attach="fog" args={[PALETTE.fog, 70, 190]} />

      <ambientLight intensity={1.6} />
      <hemisphereLight args={[PALETTE.sky, PALETTE.grass, 0.8]} />

      <directionalLight
        position={SUN_POSITION}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={200}
        // Without a bias, large flat surfaces stripe themselves with their own
        // shadow at this shadow-map resolution.
        shadow-bias={-0.0005}
      />
    </>
  );
}
