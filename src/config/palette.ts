/**
 * The colours of everything the game draws by hand.
 *
 * Buildings and trees are textured models and are not listed here; this covers
 * the ground, the sky, and the two characters. The palette stays warm, slightly
 * desaturated and deliberately small, because a limited palette is what makes
 * the scene read as a toy town rather than as untextured placeholder geometry.
 */
export const PALETTE = {
  sky: '#bfe3f2',
  fog: '#cfe6f0',

  grass: '#8fbf6a',
  cobble: '#d9cbb2',
  road: '#b6ab97',

  /**
   * Skin tone for the character models.
   *
   * This exists because every character in the Quaternius pack ships with its
   * "Skin" material set to near-black while a separate near-white "Face"
   * material covers a small patch. The value is byte-identical across all of
   * them, so it is an export artefact rather than a design choice, and left
   * alone the townsfolk render as silhouettes. See CharacterModel for the fix.
   */
  skin: '#c08a5e',

  player: '#4a7fc1',
  playerAccent: '#f2e2c4',
  npc: '#d4674f',
  npcAccent: '#6b4f3a',

  /** Training dummies: a burlap sack on a wooden post, with a painted target. */
  burlap: '#c9a46a',
  post: '#7a5a3c',
  target: '#c4473a',
  /** What a dummy flashes on a hit. Bright, so the hit registers at a glance. */
  hitFlash: '#fff4d6',
} as const;
