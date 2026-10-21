import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESIDENTS } from '../src/npc/residents.ts';

/**
 * Checks that shared game data points at files that exist. Lives with the
 * server's tests because it needs the filesystem, which browser code (and its
 * tests) deliberately cannot reach.
 */
describe('resident assets', () => {
  it('points everyone at a character model that exists', () => {
    for (const { identity, model } of RESIDENTS) {
      // Tests run from the project root.
      const path = resolve('public/models', model);
      expect(existsSync(path), `${identity.id}'s model is missing: ${model}`).toBe(true);
    }
  });
});
