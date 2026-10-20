/**
 * Where the player starts: on the square, a little south of centre, raised so
 * the capsule drops onto the ground rather than starting inside it.
 *
 * In its own file so layout tests can check things keep clear of it without
 * importing the player component and, with it, the physics engine.
 */
export const SPAWN: [x: number, y: number, z: number] = [0, 2, 8];
