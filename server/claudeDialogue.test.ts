import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { claudeDialogue, DIALOGUE_MODEL, lineRequest, type Send } from './claudeDialogue.ts';
import type { LineRequest } from './DialogueWriter.ts';
import type { KnownEvent } from './knowledge.ts';
import { findResident } from '../src/npc/residents.ts';

/**
 * The model writer, tested without the network. A scripted `send` stands in for
 * the API, so these check exactly what would be sent and what happens with
 * each kind of reply, at no cost and with no key.
 */

const gertie = findResident('gertie');
if (!gertie) throw new Error('Gertie is missing');

const NOW = 1_700_000_000_000;

const sawPunch: KnownEvent = {
  event: { id: 'p', kind: 'player-attacked', at: NOW - 60_000, position: { x: 0, y: 0, z: 0 }, witnessedBy: ['gertie'], targetId: 'dummy-a' },
  learnedAt: NOW - 60_000,
  heardFrom: null,
  hops: 0,
};

const stranger: LineRequest = { resident: gertie, known: [], said: [], now: NOW };
const afterPunch: LineRequest = { resident: gertie, known: [sawPunch], said: [], now: NOW };

/**
 * A reply with just the fields the writer reads. The full message type has
 * many more; building them all would bury what each test is about.
 */
function reply(content: Array<{ type: string; text?: string }>, stop_reason = 'end_turn'): Anthropic.Beta.Messages.BetaMessage {
  return {
    content,
    stop_reason,
    usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 800 },
  } as unknown as Anthropic.Beta.Messages.BetaMessage;
}

const answering = (json: string): Send => () =>
  Promise.resolve(reply([{ type: 'thinking' }, { type: 'text', text: json }]));

const silentLog = () => {};

describe('the request sent to the API', () => {
  const params = lineRequest(afterPunch);

  it('uses the configured model', () => {
    expect(params.model).toBe(DIALOGUE_MODEL);
  });

  it('asks for the line in a fixed JSON shape', () => {
    expect(params.output_config?.format).toMatchObject({ type: 'json_schema' });
  });

  it('keeps effort low, because a short line does not need deep thought', () => {
    expect(params.output_config?.effort).toBe('low');
  });

  it('does not ask for a refusal fallback, which Haiku 5.5 does not have', () => {
    // Haiku 5.5 has no server-side fallback: a declined request stays declined,
    // and a fallback list is rejected. A refusal is handled by the canned line.
    expect(params).not.toHaveProperty('fallbacks');
    expect(params.betas ?? []).not.toContain('server-side-fallback-2026-07-01');
  });

  it('marks the end of the persona for caching, and nothing after it', () => {
    const system = params.system;
    expect(Array.isArray(system)).toBe(true);
    if (!Array.isArray(system)) return;
    expect(system.at(-1)).toHaveProperty('cache_control');
    expect(system.slice(0, -1).some((block) => 'cache_control' in block)).toBe(false);
  });

  it('puts what the resident knows in the message, not the cached system prompt', () => {
    const message = params.messages[0];
    expect(typeof message?.content === 'string' && message.content).toMatch(/training dummies/);
    expect(JSON.stringify(params.system)).not.toMatch(/training dummies in the square, about/);
  });
});

describe('claudeDialogue', () => {
  it('returns the model’s line', async () => {
    const writer = claudeDialogue(answering('{"text":"Morning, stranger.","mood":"friendly"}'), silentLog);
    await expect(writer.write(stranger)).resolves.toEqual({ text: 'Morning, stranger.', mood: 'friendly', kind: 'small-talk' });
  });

  it('records a line about fresh news as a reaction, whatever the model says it is', async () => {
    const writer = claudeDialogue(answering('{"text":"I saw that.","mood":"friendly"}'), silentLog);
    expect((await writer.write(afterPunch)).kind).toBe('reaction');
  });

  it('falls back to a canned line when the API refuses', async () => {
    const send: Send = () => Promise.resolve(reply([], 'refusal'));
    const line = await claudeDialogue(send, silentLog).write(afterPunch);
    expect(line.text).toBe(gertie.reactions[0]);
  });

  it('falls back when the reply is unusable', async () => {
    const line = await claudeDialogue(answering('{"text":"","mood":"friendly"}'), silentLog).write(stranger);
    expect(line.text).toBe(gertie.smallTalk[0]);
  });

  it('falls back when the call fails outright, and says why in the log', async () => {
    const messages: string[] = [];
    const send: Send = () => Promise.reject(new Error('socket hang up'));
    const line = await claudeDialogue(send, (m) => messages.push(m)).write(stranger);
    expect(line.text).toBe(gertie.smallTalk[0]);
    expect(messages.join('\n')).toMatch(/socket hang up/);
  });

  it('logs token use, including cache hits, so the cost is visible', async () => {
    const messages: string[] = [];
    await claudeDialogue(answering('{"text":"Hello.","mood":"neutral"}'), (m) => messages.push(m)).write(stranger);
    expect(messages.join('\n')).toMatch(/800 cached/);
  });

  it('reports which model it is running on', () => {
    expect(claudeDialogue(answering('{}'), silentLog).status).toEqual({ mode: 'llm', model: DIALOGUE_MODEL });
  });
});
