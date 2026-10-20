import { describe, expect, it } from 'vitest';
import {
  applyGravity,
  applyHorizontalAcceleration,
  damp,
  facingAngle,
  yawToward,
  inputToWorldDirection,
  jumpVelocity,
  moveTowards,
  shortestAngleDelta,
} from './movement';
import { PLAYER } from '../config/tuning';

describe('inputToWorldDirection', () => {
  it('returns a zero vector when no keys are held', () => {
    expect(inputToWorldDirection(0, 0, 0)).toEqual({ x: 0, z: 0 });
  });

  it('normalises diagonals so they are not faster than the axes', () => {
    const diagonal = inputToWorldDirection(1, 1, 0);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
  });

  it('sends "forward" down -Z when the camera looks along -Z', () => {
    const forward = inputToWorldDirection(1, 0, 0);
    expect(forward.x).toBeCloseTo(0);
    expect(forward.z).toBeCloseTo(-1);
  });

  it('rotates input into world space as the camera yaws', () => {
    // Yawed a quarter turn, "forward" should now point down -X.
    const forward = inputToWorldDirection(1, 0, Math.PI / 2);
    expect(forward.x).toBeCloseTo(-1);
    expect(forward.z).toBeCloseTo(0);
  });
});

describe('applyHorizontalAcceleration', () => {
  it('accelerates towards top speed without overshooting it', () => {
    let velocity = { x: 0, z: 0 };
    for (let i = 0; i < 200; i++) {
      velocity = applyHorizontalAcceleration(velocity, { x: 0, z: -1 }, PLAYER.walkSpeed, true, 1 / 60);
    }
    expect(velocity.z).toBeCloseTo(-PLAYER.walkSpeed);
  });

  it('decelerates to a full stop when input is released', () => {
    let velocity = { x: 0, z: -PLAYER.walkSpeed };
    for (let i = 0; i < 200; i++) {
      velocity = applyHorizontalAcceleration(velocity, { x: 0, z: 0 }, PLAYER.walkSpeed, true, 1 / 60);
    }
    expect(velocity.x).toBe(0);
    expect(velocity.z).toBe(0);
  });

  it('stops harder than it starts, which is what makes stopping feel crisp', () => {
    const startStep = applyHorizontalAcceleration({ x: 0, z: 0 }, { x: 0, z: -1 }, PLAYER.walkSpeed, true, 1 / 60);
    const stopStep = applyHorizontalAcceleration({ x: 0, z: -PLAYER.walkSpeed }, { x: 0, z: 0 }, PLAYER.walkSpeed, true, 1 / 60);

    const gained = Math.abs(startStep.z);
    const shed = PLAYER.walkSpeed - Math.abs(stopStep.z);
    expect(shed).toBeGreaterThan(gained);
  });

  it('gives less control in the air than on the ground', () => {
    const onGround = applyHorizontalAcceleration({ x: 0, z: 0 }, { x: 0, z: -1 }, PLAYER.walkSpeed, true, 1 / 60);
    const inAir = applyHorizontalAcceleration({ x: 0, z: 0 }, { x: 0, z: -1 }, PLAYER.walkSpeed, false, 1 / 60);
    expect(Math.abs(inAir.z)).toBeLessThan(Math.abs(onGround.z));
  });

  it('does not overshoot on a long frame', () => {
    // A one-second frame is far longer than anything real, and is exactly the
    // case where an uncapped step would fling the player past top speed.
    const velocity = applyHorizontalAcceleration({ x: 0, z: 0 }, { x: 0, z: -1 }, PLAYER.walkSpeed, true, 1);
    expect(Math.abs(velocity.z)).toBeLessThanOrEqual(PLAYER.walkSpeed);
  });
});

describe('moveTowards', () => {
  it('lands exactly on the target rather than passing it', () => {
    expect(moveTowards(0, 1, 10)).toBe(1);
    expect(moveTowards(0, -1, 10)).toBe(-1);
  });

  it('takes a partial step when the target is out of reach', () => {
    expect(moveTowards(0, 10, 2)).toBe(2);
  });
});

describe('jumpVelocity', () => {
  it('reaches the configured jump height and no higher', () => {
    let height = 0;
    let velocity = jumpVelocity();
    const step = 1 / 1000;

    // Integrate the arc until the character starts falling; the apex is the peak.
    let peak = 0;
    while (velocity > 0) {
      velocity = applyGravity(velocity, step);
      height += velocity * step;
      peak = Math.max(peak, height);
    }
    expect(peak).toBeCloseTo(PLAYER.jumpHeight, 1);
  });
});

describe('applyGravity', () => {
  it('clamps at terminal velocity however long the fall', () => {
    let velocity = 0;
    for (let i = 0; i < 1000; i++) velocity = applyGravity(velocity, 1 / 60);
    expect(velocity).toBe(-PLAYER.terminalVelocity);
  });
});

describe('shortestAngleDelta', () => {
  it('turns the short way across the -PI/PI seam', () => {
    const delta = shortestAngleDelta(Math.PI - 0.1, -Math.PI + 0.1);
    expect(Math.abs(delta)).toBeCloseTo(0.2);
  });

  it('reports zero for an angle that is already correct', () => {
    expect(shortestAngleDelta(1.2, 1.2)).toBeCloseTo(0);
  });
});

describe('damp', () => {
  it('converges on the target', () => {
    let value = 0;
    for (let i = 0; i < 500; i++) value = damp(value, 10, 8, 1 / 60);
    expect(value).toBeCloseTo(10);
  });

  it('reaches the same place regardless of frame rate', () => {
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = damp(at60, 10, 8, 1 / 60);

    let at30 = 0;
    for (let i = 0; i < 30; i++) at30 = damp(at30, 10, 8, 1 / 30);

    expect(at60).toBeCloseTo(at30, 5);
  });
});

describe('facingAngle', () => {
  it('faces forward, along -Z, at zero rotation', () => {
    expect(facingAngle({ x: 0, z: -1 })).toBeCloseTo(0);
  });

  it('faces backwards at half a turn', () => {
    expect(Math.abs(facingAngle({ x: 0, z: 1 }))).toBeCloseTo(Math.PI);
  });

  it('points the model where it is actually travelling', () => {
    // Reconstruct the model's forward vector from the angle it produces and
    // check it matches the direction of travel. This is the assertion that
    // catches a character running backwards.
    for (const velocity of [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0.7, z: -0.7 },
      { x: -0.5, z: 0.5 },
    ]) {
      const angle = facingAngle(velocity);
      const forward = { x: -Math.sin(angle), z: -Math.cos(angle) };
      const length = Math.hypot(velocity.x, velocity.z);

      expect(forward.x).toBeCloseTo(velocity.x / length);
      expect(forward.z).toBeCloseTo(velocity.z / length);
    }
  });
});

describe('yawToward', () => {
  it('points straight down -Z at a target directly ahead', () => {
    expect(yawToward([0, 0], [0, -5])).toBeCloseTo(0);
  });

  it('turns to face a target off to one side', () => {
    const yaw = yawToward([2, 3], [7, 3]);
    // Forward at this yaw should point along +X.
    expect(-Math.sin(yaw)).toBeCloseTo(1);
    expect(-Math.cos(yaw)).toBeCloseTo(0);
  });
});
