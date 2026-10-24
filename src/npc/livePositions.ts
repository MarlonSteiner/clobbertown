import type { Positioned } from '../interaction/proximity';
import { findResident, RESIDENTS } from './residents';

/**
 * Where each resident is right now, on the ground plane.
 *
 * Written every frame by the resident's model and read by anything that asks
 * where people are: talking to someone, and who saw a punch. Residents walk
 * about their day, so a fixed home position is only right at night.
 *
 * Not React state, for the same reason as the player's position: it changes
 * every frame and nothing needs to re-render when it does.
 */
const positions = new Map<string, { x: number; z: number }>();

export function setLivePosition(id: string, x: number, z: number): void {
  const current = positions.get(id);
  if (current) {
    current.x = x;
    current.z = z;
  } else {
    positions.set(id, { x, z });
  }
}

/** Where a resident is now. Before their first frame, where they live. */
export function livePosition(id: string): { x: number; z: number } {
  const known = positions.get(id);
  if (known) return known;
  const home = findResident(id)?.home;
  return home ? { x: home[0], z: home[1] } : { x: 0, z: 0 };
}

/** Every resident, placed where they are now, in the shape the proximity and witness checks use. */
export function liveResidents(): Positioned[] {
  return RESIDENTS.map((resident) => ({
    id: resident.identity.id,
    position: livePosition(resident.identity.id),
  }));
}
