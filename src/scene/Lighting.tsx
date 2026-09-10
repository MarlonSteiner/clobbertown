import { PALETTE } from '../config/palette';
import { WORLD } from '../config/tuning';

/** Where the sun sits. High and off to one side, so buildings cast readable shadows. */
const SUN_POSITION: [number, number, number] = [40, 60, 25];

/**
 * A single directional sun plus an ambient fill.
 *
 * Flat, cheerful lighting is what sells the toy-town look; a physically
 * plausible setup would put half the scene in shadow and read as gloomy. The
 * ambient term is generous on purpose so shadowed faces stay colourful.
 *
 * These intensities are tuned for the models' physically-based materials,
 * which respond to light very differently from the flat-shaded primitives the
 * scene used before: the values that lit those correctly blow these out to
 * white, so do not raise them without looking at a building afterwards.
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

      <ambientLight intensity={0.55} />
      <hemisphereLight args={[PALETTE.sky, PALETTE.grass, 0.6]} />

      <directionalLight
        position={SUN_POSITION}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={200}
        /* normalBias rather than a plain bias: it offsets along the surface
           normal, which is what stops the low-poly models shadowing their own
           faces black. A flat depth bias cannot fix that without also
           detaching shadows from the feet of everything that casts them. */
        shadow-normalBias={0.05}
        shadow-bias={-0.0002}
      />
    </>
  );
}
