import { describe, expect, it } from 'vitest';
import { applyHit, applyLeanToPivot, createWobble, stepWobble } from './wobble';
import { COMBAT } from '../config/tuning';

function simulate(seconds: number, wobble = createWobble(), step = 1 / 60) {
  for (let t = 0; t < seconds; t += step) stepWobble(wobble, step);
  return wobble;
}

describe('dummy wobble', () => {
  it('stays upright when nothing touches it', () => {
    const wobble = simulate(2);
    expect(wobble.leanX).toBe(0);
    expect(wobble.leanZ).toBe(0);
  });

  it('leans away from whoever hit it', () => {
    // Puncher is to the -X side, so the hit direction points along +X.
    const wobble = createWobble();
    applyHit(wobble, 1, 0);
    stepWobble(wobble, 1 / 60);
    stepWobble(wobble, 1 / 60);
    expect(wobble.leanX).toBeGreaterThan(0);
    expect(Math.abs(wobble.leanZ)).toBeLessThan(1e-9);
  });

  it('rocks back past upright before settling, so it reads as springy', () => {
    const wobble = createWobble();
    applyHit(wobble, 1, 0);

    let wentNegative = false;
    for (let i = 0; i < 120; i++) {
      stepWobble(wobble, 1 / 60);
      if (wobble.leanX < 0) wentNegative = true;
    }
    expect(wentNegative).toBe(true);
  });

  it('comes back to rest', () => {
    const wobble = createWobble();
    applyHit(wobble, 1, 0);
    simulate(4, wobble);
    expect(Math.abs(wobble.leanX)).toBeLessThan(0.001);
  });

  it('never leans past its limit, however hard it is hit', () => {
    const wobble = createWobble();
    let maxLean = 0;
    for (let i = 0; i < 20; i++) {
      applyHit(wobble, 1, 0);
      stepWobble(wobble, 1 / 60);
      maxLean = Math.max(maxLean, Math.hypot(wobble.leanX, wobble.leanZ));
    }
    expect(maxLean).toBeLessThanOrEqual(COMBAT.dummyMaxTilt + 1e-9);
  });

  it('survives a very long frame without blowing up', () => {
    const wobble = createWobble();
    applyHit(wobble, 1, 0);
    stepWobble(wobble, 5);
    expect(Number.isFinite(wobble.leanX)).toBe(true);
    expect(Math.abs(wobble.leanX)).toBeLessThanOrEqual(COMBAT.dummyMaxTilt);
  });
});

describe('applyLeanToPivot', () => {
  /** Where the top of a dummy ends up in world space after leaning. */
  async function topAfterLean(leanX: number, leanZ: number, facing: number) {
    const THREE = await import('three');
    const dummy = new THREE.Group();
    dummy.rotation.y = facing;
    const pivot = new THREE.Group();
    dummy.add(pivot);

    applyLeanToPivot(pivot, { leanX, leanZ, velocityX: 0, velocityZ: 0 }, facing);
    dummy.updateMatrixWorld(true);
    return pivot.localToWorld(new THREE.Vector3(0, 1, 0));
  }

  for (const facing of [0, 0.5, 1.1, Math.PI / 2, -2.4, Math.PI]) {
    it(`leans the way it was pushed when facing ${facing.toFixed(2)}`, async () => {
      const top = await topAfterLean(0.3, 0, facing);
      expect(top.x).toBeGreaterThan(0.25);
      expect(Math.abs(top.z)).toBeLessThan(0.02);
    });
  }

  it('leans along Z too, not only X', async () => {
    const top = await topAfterLean(0, -0.3, 0.8);
    expect(top.z).toBeLessThan(-0.25);
    expect(Math.abs(top.x)).toBeLessThan(0.02);
  });
});
