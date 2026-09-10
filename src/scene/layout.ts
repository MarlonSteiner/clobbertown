import { WORLD } from '../config/tuning';

/**
 * One structure in the town.
 *
 * Buildings are described as data rather than hand-placed JSX so the town can
 * be rearranged without touching rendering code, and so Phase 1's primitives
 * can be swapped for real models one building at a time: set `model` to an
 * asset path and the renderer will load that instead of building a box.
 */
export interface BuildingSpec {
  id: string;
  /** Centre of the footprint, on the ground plane. */
  position: [x: number, z: number];
  /** Footprint width (X) and depth (Z) before rotation. */
  footprint: [width: number, depth: number];
  /** Height of the walls, excluding the roof. */
  height: number;
  /** Rotation about Y, in radians. */
  rotation: number;
  /** Index into PALETTE.walls / PALETTE.roofs. */
  colourIndex: number;
  /** Shape of the roof. Flat-roofed buildings read as shops rather than houses. */
  roof: 'gable' | 'flat';
  /** Set once a real model exists for this building; overrides the primitive. */
  model?: string;
}

export interface TreeSpec {
  id: string;
  position: [x: number, z: number];
  /** Overall scale, varied so a row of trees does not look stamped. */
  scale: number;
}

/** Side length of the raised cobbled square at the centre of town. */
export const SQUARE_SIZE = 24;

/**
 * Streets are drawn as flat quads laid over the grass. They are decoration
 * with no collision, so the player crosses freely between road and verge.
 */
export interface StreetSpec {
  id: string;
  position: [x: number, z: number];
  size: [width: number, depth: number];
}

export const STREETS: StreetSpec[] = [
  // Two main roads crossing at the square, running the full width of the town.
  { id: 'high-street', position: [0, 0], size: [WORLD.size, 9] },
  { id: 'mill-road', position: [0, 0], size: [9, WORLD.size] },
  // A short lane behind the north terrace, so the town is not a perfect cross.
  { id: 'back-lane', position: [-18, -30], size: [40, 6] },
];

/**
 * The buildings, arranged in four blocks around the central square with a
 * gap left on each side for the roads. Positions are hand-placed rather than
 * generated: a small town wants to look deliberate, and 14 buildings is well
 * under the point where procedural placement earns its complexity.
 */
export const BUILDINGS: BuildingSpec[] = [
  // North-west block
  { id: 'town-hall', position: [-20, -20], footprint: [12, 10], height: 7, rotation: 0, colourIndex: 2, roof: 'gable' },
  { id: 'bakery', position: [-33, -18], footprint: [8, 8], height: 4.5, rotation: 0, colourIndex: 0, roof: 'gable' },
  { id: 'cottage-a', position: [-22, -34], footprint: [7, 7], height: 4, rotation: 0.15, colourIndex: 3, roof: 'gable' },
  { id: 'cottage-b', position: [-33, -33], footprint: [7, 6], height: 4, rotation: -0.1, colourIndex: 4, roof: 'gable' },

  // North-east block
  { id: 'inn', position: [22, -22], footprint: [13, 11], height: 8, rotation: 0, colourIndex: 1, roof: 'gable' },
  { id: 'smithy', position: [36, -16], footprint: [9, 8], height: 5, rotation: 0, colourIndex: 5, roof: 'flat' },
  { id: 'cottage-c', position: [24, -37], footprint: [7, 7], height: 4, rotation: -0.2, colourIndex: 0, roof: 'gable' },

  // South-west block
  { id: 'library', position: [-24, 22], footprint: [11, 12], height: 6.5, rotation: 0, colourIndex: 4, roof: 'flat' },
  { id: 'grocer', position: [-36, 24], footprint: [8, 9], height: 5, rotation: 0, colourIndex: 1, roof: 'gable' },
  { id: 'cottage-d', position: [-22, 36], footprint: [7, 7], height: 4, rotation: 0.25, colourIndex: 2, roof: 'gable' },

  // South-east block
  { id: 'workshop', position: [24, 21], footprint: [10, 10], height: 6, rotation: 0, colourIndex: 3, roof: 'flat' },
  { id: 'cottage-e', position: [37, 26], footprint: [8, 7], height: 4.5, rotation: -0.15, colourIndex: 5, roof: 'gable' },
  { id: 'cottage-f', position: [23, 36], footprint: [7, 8], height: 4, rotation: 0.1, colourIndex: 1, roof: 'gable' },
  { id: 'barn', position: [38, 38], footprint: [12, 9], height: 6, rotation: 0.4, colourIndex: 2, roof: 'gable' },
];

/** Trees at the square's corners and scattered along the edges of town. */
export const TREES: TreeSpec[] = [
  { id: 'square-nw', position: [-10, -10], scale: 1.0 },
  { id: 'square-ne', position: [10, -10], scale: 1.15 },
  { id: 'square-sw', position: [-10, 10], scale: 0.9 },
  { id: 'square-se', position: [10, 10], scale: 1.05 },
  { id: 'lane-a', position: [-40, -6], scale: 1.2 },
  { id: 'lane-b', position: [-40, 6], scale: 0.95 },
  { id: 'lane-c', position: [41, -6], scale: 1.1 },
  { id: 'lane-d', position: [41, 8], scale: 1.25 },
  { id: 'edge-a', position: [-6, -42], scale: 1.3 },
  { id: 'edge-b', position: [8, -41], scale: 1.0 },
  { id: 'edge-c', position: [-8, 41], scale: 1.15 },
  { id: 'edge-d', position: [7, 42], scale: 0.9 },
];
