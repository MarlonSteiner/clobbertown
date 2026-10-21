import type { ObservationKind, WorldObservation } from '../src/npc/NpcBrain.ts';
import { findResident } from '../src/npc/residents.ts';

/**
 * Checks the JSON the browser sends before anything acts on it.
 *
 * It arrives from outside the server, so nothing about its shape is assumed:
 * a malformed request is rejected here instead of failing somewhere deeper,
 * or worse, ending up in a resident's memory or a paid prompt.
 */

const OBSERVATION_KINDS: ReadonlySet<ObservationKind> = new Set([
  'player-approached',
  'player-spoke',
  'player-left',
  'player-attacked',
]);

export interface ObserveCommand {
  npcId: string;
  observation: WorldObservation;
}

export interface ConverseCommand {
  npcId: string;
}

export function parseObserve(body: unknown): ObserveCommand | null {
  if (!isRecord(body)) return null;
  const npcId = residentId(body.npcId);
  const observation = parseObservation(body.observation);
  if (!npcId || !observation) return null;
  return { npcId, observation };
}

/**
 * Only the resident's id is taken from a conversation request. Who they are
 * and what they know come from the server's own records, never from what the
 * browser claims about them.
 */
export function parseConverse(body: unknown): ConverseCommand | null {
  if (!isRecord(body)) return null;
  const npcId = residentId(body.npcId);
  return npcId ? { npcId } : null;
}

function parseObservation(value: unknown): WorldObservation | null {
  if (!isRecord(value)) return null;

  const { kind, at, position, witnessedBy, targetId } = value;
  if (typeof kind !== 'string' || !OBSERVATION_KINDS.has(kind as ObservationKind)) return null;
  if (!isFiniteNumber(at)) return null;
  if (!isRecord(position)) return null;
  if (!isFiniteNumber(position.x) || !isFiniteNumber(position.y) || !isFiniteNumber(position.z)) {
    return null;
  }
  if (!Array.isArray(witnessedBy) || !witnessedBy.every((id) => residentId(id) !== null)) {
    return null;
  }
  if (targetId !== undefined && (typeof targetId !== 'string' || targetId.length > 64)) return null;

  const observation: WorldObservation = {
    kind: kind as ObservationKind,
    at,
    position: { x: position.x, y: position.y, z: position.z },
    witnessedBy: witnessedBy as string[],
  };
  if (typeof targetId === 'string') observation.targetId = targetId;
  return observation;
}

/** A string naming someone who actually lives in town, or null. */
function residentId(value: unknown): string | null {
  return typeof value === 'string' && findResident(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
