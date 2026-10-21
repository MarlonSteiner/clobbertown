import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cannedDialogue } from './cannedDialogue.ts';
import { MemoryStore } from './MemoryStore.ts';
import { converse, forget, observe, status, type BrainServer } from './routes.ts';

/**
 * The brain server end to end: observations in, remembered, and coming back
 * out as dialogue. Uses the canned writer, so it costs nothing and needs no key.
 */

const T0 = 1_700_000_000_000;

function makeServer(path: string | null = null, at = T0): BrainServer {
  return { store: new MemoryStore(path), writer: cannedDialogue, now: () => at };
}

const punch = {
  npcId: 'gertie',
  observation: {
    kind: 'player-attacked',
    at: T0 - 1000,
    position: { x: 0, y: 0, z: 0 },
    witnessedBy: ['gertie'],
    targetId: 'dummy-a',
  },
};

async function talk(server: BrainServer) {
  const reply = await converse(server, { npcId: 'gertie' });
  expect(reply.status).toBe(200);
  return reply.body as { text: string; mood: string };
}

describe('brain server routes', () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  const tempSave = () => {
    const dir = mkdtempSync(join(tmpdir(), 'clobbertown-'));
    tempDirs.push(dir);
    return join(dir, 'saves', 'memory.json');
  };

  it('makes small talk with a stranger', async () => {
    expect((await talk(makeServer())).mood).toBe('friendly');
  });

  it('brings up a punch the resident saw', async () => {
    const server = makeServer();
    expect(observe(server, punch).status).toBe(204);
    const reply = await talk(server);
    expect(reply.mood).toBe('wary');
    expect(reply.text).toMatch(/saw/i);
  });

  it('mentions it once, then moves on', async () => {
    let clock = T0;
    const server: BrainServer = { store: new MemoryStore(null), writer: cannedDialogue, now: () => clock };
    observe(server, punch);
    await talk(server);
    clock += 1000;
    expect((await talk(server)).mood).toBe('friendly');
  });

  it('remembers across a restart, which is the point of this phase', async () => {
    const save = tempSave();
    observe(makeServer(save), punch);

    // A fresh server reading the same save file: the page was reloaded, or the
    // dev server restarted, or it is tomorrow.
    const reply = await talk(makeServer(save));
    expect(reply.text).toMatch(/saw/i);
  });

  it('stores one event however many witnesses report it', () => {
    const save = tempSave();
    const server = makeServer(save);
    observe(server, punch);
    observe(server, punch);
    const file = JSON.parse(readFileSync(save, 'utf8')) as { events: unknown[] };
    expect(file.events).toHaveLength(1);
  });

  it('forgets everything on request', async () => {
    const server = makeServer();
    observe(server, punch);
    forget(server);
    expect((await talk(server)).mood).toBe('friendly');
  });

  it('turns away malformed requests without remembering them', async () => {
    const server = makeServer();
    expect(observe(server, { npcId: 'gertie', observation: { kind: 'nonsense' } }).status).toBe(400);
    expect((await converse(server, { npcId: 'nobody' })).status).toBe(400);
    expect(server.store.events).toHaveLength(0);
  });

  it('reports that it is running on canned lines', () => {
    expect(status(makeServer()).body).toEqual({ mode: 'canned', model: null });
  });

  it('starts fresh, without losing the old file, when the save is unreadable', async () => {
    const save = tempSave();
    observe(makeServer(save), punch);
    // Corrupt it.
    const { writeFileSync } = await import('node:fs');
    writeFileSync(save, '{ this is not json');

    const reply = await talk(makeServer(save));
    expect(reply.mood).toBe('friendly');
  });
});
