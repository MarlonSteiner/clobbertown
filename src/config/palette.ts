/**
 * The town's colour palette.
 *
 * Warm, slightly desaturated, and deliberately limited. A small palette is
 * what makes a low-poly scene read as a toy town rather than as untextured
 * placeholder geometry, so new colours should be added reluctantly.
 */
export const PALETTE = {
  sky: '#bfe3f2',
  fog: '#cfe6f0',

  grass: '#8fbf6a',
  cobble: '#d9cbb2',
  road: '#b6ab97',

  /** Building walls, cycled through so neighbouring houses differ. */
  walls: ['#e8b98a', '#d98c7a', '#e5d3a6', '#b4c9a8', '#c9a9c4', '#e0c391'] as const,
  /** Roofs, matched by index to the wall above. */
  roofs: ['#a35b4a', '#8c4b48', '#a8703f', '#6f8a5e', '#7d5f7a', '#9a6b3f'] as const,

  trim: '#6b4f3a',
  window: '#7fb3c8',
  foliage: '#5f9147',
  trunk: '#7a5a3c',

  player: '#4a7fc1',
  playerAccent: '#f2e2c4',
  npc: '#d4674f',
} as const;
