import { WORLD } from '../config/tuning';

/**
 * One structure in the town.
 *
 * Buildings are described as data rather than hand-placed JSX so the town can
 * be rearranged without touching rendering code.
 *
 * `footprint` is the plot the building is given, in world units, and the model
 * is scaled uniformly to fit inside it. That split is what keeps the layout
 * stable: the town decides how much ground each building occupies, and swapping
 * one model for another changes how the building looks without shifting its
 * neighbours or reopening the question of whether anything overlaps.
 */
export interface BuildingSpec {
  id: string;
  /** Path under `public/models/`. */
  model: string;
  /** Centre of the plot, on the ground plane. */
  position: [x: number, z: number];
  /** The plot the model is fitted into: width (X) and depth (Z) before rotation. */
  footprint: [width: number, depth: number];
  /** Rotation about Y, in radians. */
  rotation: number;
}

export interface TreeSpec {
  id: string;
  model: string;
  position: [x: number, z: number];
  /** How tall the tree stands, in world units. The model is scaled to match. */
  height: number;
  /** Rotation about Y, so a row of the same tree does not look stamped. */
  rotation: number;
}

/** Side length of the raised cobbled square at the centre of town. */
export const SQUARE_SIZE = 24;

/** Width of the two main roads that cross at the square. */
export const ROAD_WIDTH = 9;

/**
 * Streets are flat quads laid over the grass. They are decoration with no
 * collision, so the player crosses freely between road and verge.
 */
export interface StreetSpec {
  id: string;
  position: [x: number, z: number];
  size: [width: number, depth: number];
}

export const STREETS: StreetSpec[] = [
  { id: 'high-street', position: [0, 0], size: [WORLD.size, ROAD_WIDTH] },
  { id: 'mill-road', position: [0, 0], size: [ROAD_WIDTH, WORLD.size] },
  // A short lane behind the north-west terrace, so the town is not a bare cross.
  { id: 'back-lane', position: [-24, -27], size: [30, 5] },
];

/**
 * The buildings, in four blocks around the square with the roads left clear.
 *
 * Positions are hand-placed rather than generated. Fourteen buildings is well
 * under the point where procedural placement earns its complexity, and a small
 * town wants to look deliberate. `layout.test.ts` checks that no two plots
 * overlap and that nothing is standing in a road.
 */
export const BUILDINGS: BuildingSpec[] = [
  // North-west block
  { id: 'town-hall', model: 'buildings/commercial/shop-e.glb', position: [-22, -19], footprint: [12, 10], rotation: 0 },
  { id: 'bakery', model: 'buildings/commercial/shop-c.glb', position: [-37, -20], footprint: [9, 9], rotation: 0 },
  { id: 'cottage-a', model: 'buildings/suburban/house-a.glb', position: [-21, -35], footprint: [8, 8], rotation: 0.15 },
  { id: 'cottage-b', model: 'buildings/suburban/house-c.glb', position: [-35, -35], footprint: [8, 7], rotation: -0.1 },

  // North-east block
  { id: 'inn', model: 'buildings/suburban/house-b.glb', position: [22, -21], footprint: [13, 11], rotation: 0 },
  { id: 'smithy', model: 'buildings/commercial/shop-f.glb', position: [37, -17], footprint: [10, 9], rotation: 0 },
  { id: 'cottage-c', model: 'buildings/suburban/house-e.glb', position: [24, -36], footprint: [8, 8], rotation: -0.2 },

  // South-west block
  { id: 'library', model: 'buildings/commercial/shop-a.glb', position: [-24, 21], footprint: [11, 12], rotation: 0 },
  { id: 'grocer', model: 'buildings/commercial/shop-h.glb', position: [-38, 23], footprint: [9, 10], rotation: 0 },
  { id: 'cottage-d', model: 'buildings/suburban/house-g.glb', position: [-21, 36], footprint: [8, 8], rotation: 0.25 },

  // South-east block
  { id: 'workshop', model: 'buildings/commercial/shop-g.glb', position: [23, 21], footprint: [10, 10], rotation: 0 },
  { id: 'cottage-e', model: 'buildings/suburban/house-i.glb', position: [37, 25], footprint: [8, 7], rotation: -0.15 },
  { id: 'cottage-f', model: 'buildings/suburban/house-j.glb', position: [22, 36], footprint: [8, 8], rotation: 0.1 },
  { id: 'barn', model: 'buildings/suburban/house-f.glb', position: [38, 38], footprint: [12, 9], rotation: 0.4 },
];

/** Trees at the square's corners and scattered along the edges of town. */
export const TREES: TreeSpec[] = [
  { id: 'square-nw', model: 'nature/tree-default.glb', position: [-14, -14], height: 6.5, rotation: 0.4 },
  { id: 'square-ne', model: 'nature/tree-oak.glb', position: [14, -14], height: 5.8, rotation: 1.9 },
  { id: 'square-sw', model: 'nature/tree-fat.glb', position: [-14, 14], height: 5.2, rotation: 3.1 },
  { id: 'square-se', model: 'nature/tree-detailed.glb', position: [14, 14], height: 6.0, rotation: 2.4 },

  { id: 'verge-w-a', model: 'nature/tree-blocks.glb', position: [-45, -7], height: 5.0, rotation: 0.9 },
  { id: 'verge-w-b', model: 'nature/tree-default.glb', position: [-45, 7], height: 6.2, rotation: 2.7 },
  { id: 'verge-e-a', model: 'nature/tree-cone.glb', position: [45, -7], height: 6.8, rotation: 1.2 },
  { id: 'verge-e-b', model: 'nature/tree-oak.glb', position: [45, 8], height: 5.6, rotation: 0.2 },

  { id: 'verge-n-a', model: 'nature/tree-detailed.glb', position: [-7, -45], height: 6.4, rotation: 1.6 },
  { id: 'verge-n-b', model: 'nature/tree-fat.glb', position: [8, -45], height: 5.4, rotation: 3.4 },
  { id: 'verge-s-a', model: 'nature/tree-cone.glb', position: [-8, 45], height: 7.0, rotation: 2.1 },
  { id: 'verge-s-b', model: 'nature/tree-blocks.glb', position: [7, 45], height: 5.1, rotation: 0.6 },
];

/** Axis-aligned extent of a plot on the ground, in world units. */
export interface PlotBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * The ground a building actually covers, once its rotation is taken into
 * account.
 *
 * A rotated rectangle needs more room than an unrotated one, and the amount is
 * not obvious by eye, so the layout tests measure it rather than trusting the
 * numbers to look about right.
 */
export function plotBounds(spec: BuildingSpec): PlotBounds {
  const [width, depth] = spec.footprint;
  const [x, z] = spec.position;

  const cos = Math.abs(Math.cos(spec.rotation));
  const sin = Math.abs(Math.sin(spec.rotation));

  const halfWidth = (width * cos + depth * sin) / 2;
  const halfDepth = (width * sin + depth * cos) / 2;

  return { minX: x - halfWidth, maxX: x + halfWidth, minZ: z - halfDepth, maxZ: z + halfDepth };
}

/** Whether two plots share any ground. Touching edges do not count. */
export function plotsOverlap(a: PlotBounds, b: PlotBounds): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
}
