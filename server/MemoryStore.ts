import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ObservationKind, WorldObservation } from '../src/npc/NpcBrain.ts';

/** Something that happened, as remembered by the town. */
export interface StoredEvent {
  /** Deterministic, so the same event reported by several witnesses is stored once. */
  id: string;
  kind: ObservationKind;
  /** Epoch milliseconds. */
  at: number;
  position: { x: number; y: number; z: number };
  witnessedBy: string[];
  targetId?: string;
}

/** Something a resident said. */
export interface StoredUtterance {
  npcId: string;
  text: string;
  at: number;
  /**
   * What the line was about. Canned dialogue uses it to keep its place in each
   * list; the language model is shown recent lines so it does not repeat itself.
   */
  kind: 'small-talk' | 'reaction';
}

interface SaveFile {
  version: 1;
  events: StoredEvent[];
  utterances: StoredUtterance[];
}

/**
 * Old memories are dropped past this many. A town only needs to remember the
 * recent past to feel alive, and an unbounded log would eventually make every
 * prompt longer and slower.
 */
const MAX_EVENTS = 500;
const MAX_UTTERANCES = 500;

/**
 * Everything the town remembers, persisted to a JSON file.
 *
 * Plain JSON because the data is small, and because being able to open the
 * save and read exactly what each resident knows is worth more while building
 * this than any query capability a database would add.
 *
 * Pass `null` as the path to keep everything in memory, which is what tests do.
 */
export class MemoryStore {
  private data: SaveFile | null = null;

  constructor(private readonly path: string | null) {}

  /** Records an observation reported by one witness, merging duplicates. */
  record(observation: WorldObservation): void {
    const data = this.load();
    const id = eventId(observation);
    const existing = data.events.find((event) => event.id === id);

    if (existing) {
      // Each witness reports the same punch separately; fold them together.
      for (const witness of observation.witnessedBy) {
        if (!existing.witnessedBy.includes(witness)) existing.witnessedBy.push(witness);
      }
    } else {
      const event: StoredEvent = {
        id,
        kind: observation.kind,
        at: observation.at,
        position: { ...observation.position },
        witnessedBy: [...observation.witnessedBy],
      };
      if (observation.targetId !== undefined) event.targetId = observation.targetId;
      data.events.push(event);
      if (data.events.length > MAX_EVENTS) data.events.splice(0, data.events.length - MAX_EVENTS);
    }

    this.save();
  }

  /** Records a line a resident said. */
  say(utterance: StoredUtterance): void {
    const data = this.load();
    data.utterances.push(utterance);
    if (data.utterances.length > MAX_UTTERANCES) {
      data.utterances.splice(0, data.utterances.length - MAX_UTTERANCES);
    }
    this.save();
  }

  get events(): readonly StoredEvent[] {
    return this.load().events;
  }

  /** Everything one resident has said, oldest first. */
  utterancesBy(npcId: string): StoredUtterance[] {
    return this.load().utterances.filter((utterance) => utterance.npcId === npcId);
  }

  /** Forgets everything. */
  reset(): void {
    this.data = emptySave();
    this.save();
  }

  /**
   * Reads the save on first use rather than at construction, so creating the
   * store (which happens whenever the dev server starts, and in test runs)
   * never touches the disk on its own.
   */
  private load(): SaveFile {
    if (this.data) return this.data;
    this.data = this.path ? readSave(this.path) : emptySave();
    return this.data;
  }

  /**
   * Writes to a temporary file and renames it over the save. The rename is
   * atomic, so a crash mid-write leaves the previous save intact instead of a
   * half-written file that forgets the whole town.
   */
  private save(): void {
    if (!this.path || !this.data) return;
    mkdirSync(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    writeFileSync(temporary, JSON.stringify(this.data, null, 2));
    renameSync(temporary, this.path);
  }
}

function emptySave(): SaveFile {
  return { version: 1, events: [], utterances: [] };
}

/**
 * Loads a save, or starts fresh if there is none. A save that cannot be read
 * is moved aside rather than overwritten, so a bug here costs a restart and
 * not the player's history.
 */
function readSave(path: string): SaveFile {
  if (!existsSync(path)) return emptySave();

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (isSaveFile(parsed)) return parsed;
    throw new Error('unrecognised save format');
  } catch (error) {
    const aside = `${path}.unreadable-${Date.now()}`;
    renameSync(path, aside);
    console.warn(`[npc] Could not read ${path}; moved it to ${aside} and started fresh.`, error);
    return emptySave();
  }
}

function isSaveFile(value: unknown): value is SaveFile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<SaveFile>;
  return candidate.version === 1 && Array.isArray(candidate.events) && Array.isArray(candidate.utterances);
}

/**
 * The same event reported by different witnesses carries the same kind, time
 * and target, so those identify it. Two genuinely different punches would have
 * to land in the same millisecond on the same target to collide.
 */
function eventId(observation: WorldObservation): string {
  return `${observation.kind}:${observation.at}:${observation.targetId ?? ''}`;
}
