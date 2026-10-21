import type { NpcMood } from '../src/npc/NpcBrain.ts';
import { findResident, type Resident } from '../src/npc/residents.ts';
import { freshNews, type LineRequest } from './DialogueWriter.ts';
import type { KnownEvent } from './knowledge.ts';

/**
 * Turns what a resident knows into a prompt, and the model's reply back into a
 * line of dialogue.
 *
 * The prompt is split by how often each part changes, because caching only
 * works on an unchanging prefix. The system prompt holds the world, the rules
 * and the persona, which never change for a given resident, so it is identical
 * byte for byte on every call. Everything that does change, what they know and
 * what they have said, goes in the user message after it. Nothing time-based
 * may go in the system prompt: one changed byte there and nothing is reused.
 */

const WORLD_AND_RULES = `You voice one resident of Clobbertown, a small market town in a cosy, low-poly brawler video game. You speak one line at a time, aloud, to the player.

THE TOWN
Clobbertown is a toy-like town of a few dozen people around a cobbled square. The square has three training dummies, burlap sacks on wooden posts with painted red targets. Around it are a bakery, an inn, a smithy, a library, a grocer, a workshop, a barn and a handful of cottages. Everyone knows everyone, and news travels fast because people talk.

THE PLAYER
The player is a newcomer who has just arrived. Nobody knows their name, so call them nothing in particular, or something a person in your position might say to a stranger. They are a brawler, and how they behave decides how the town treats them.

WHAT YOU KNOW
Each time you speak, you are told exactly what you know about the newcomer: things you saw yourself, and things a neighbour told you. That list is the whole truth as far as you are concerned.
- Only mention things about the newcomer that are on that list. Never invent things they did.
- If a neighbour told you something, say so and name them, and sound a little less certain than if you had seen it.
- Anything marked as not yet mentioned to them is on your mind: bring it up now.
- Do not keep raising old news you have already mentioned unless it is relevant.
- You may add small everyday colour about yourself and your trade, but invent nothing about the other residents' dealings with the newcomer.

HOW YOU SPEAK
- One or two short sentences, under 35 words, spoken directly to the newcomer.
- Only the words you say aloud: no stage directions, no narration, no quotation marks, no asterisks, no emoji.
- Stay in character. Never mention being an AI, a game, a prompt or a list.
- Keep it light, warm and funny, suitable for all ages. No swearing. Residents disapprove of thuggery in a small-town way: tutting, gossiping, refusing to serve, never cruelty.
- Do not repeat or closely paraphrase your recent lines.
- Choose the mood that matches how you feel toward the newcomer right now.`;

/** The system prompt for one resident. Identical on every call for that resident. */
export function systemPrompt(resident: Resident): string[] {
  return [
    WORLD_AND_RULES,
    `WHO YOU ARE\nYou are ${resident.identity.name}. ${resident.identity.role}\n${resident.persona}`,
  ];
}

/** How many of a resident's recent lines are shown to them, so they do not repeat themselves. */
const RECENT_LINES_SHOWN = 4;

/** The changing part: what this resident knows and has said, as of `request.now`. */
export function situation(request: LineRequest): string {
  const { known, said, now } = request;
  const fresh = new Set(freshNews(request));
  const parts: string[] = ['The newcomer has walked up to you and is waiting for you to speak.'];

  const attacks = known.filter((entry) => entry.event.kind === 'player-attacked');
  if (attacks.length === 0 && said.length === 0) {
    parts.push('You know nothing about them yet. This is the first time you have met.');
  } else {
    const facts = attacks
      .slice()
      .sort((a, b) => a.learnedAt - b.learnedAt)
      .map((entry) => `- ${describe(entry, now)}${fresh.has(entry) ? ' (You have not mentioned this to them yet.)' : ''}`);
    if (said.length > 0) {
      facts.push(`- You have spoken to them ${said.length === 1 ? 'once' : `${said.length} times`} before.`);
    }
    parts.push(`What you know about the newcomer:\n${facts.join('\n')}`);
  }

  const recent = said.slice(-RECENT_LINES_SHOWN);
  if (recent.length > 0) {
    parts.push(`Your most recent lines to them, oldest first:\n${recent.map((line) => `- ${line.text}`).join('\n')}`);
  }

  parts.push('Say your next line.');
  return parts.join('\n\n');
}

/** One known event, in plain words, with when and how the resident learned it. */
function describe(entry: KnownEvent, now: number): string {
  const deed = deedOf(entry.event.targetId);
  const when = ago(now - entry.event.at);
  if (entry.heardFrom === null) return `You saw them ${deed.seen}, ${when}.`;
  const teller = findResident(entry.heardFrom)?.identity.name ?? 'A neighbour';
  return `${teller} told you that they ${deed.told}, ${when}.`;
}

/**
 * What the player did, in words. Anything struck that is not a resident is a
 * training dummy: they are the only other thing in town a punch can land on.
 * Worked out from the id alone so the server does not import the game's scene
 * data, which would drag the whole of the game's code into the server.
 */
function deedOf(targetId: string | undefined): { seen: string; told: string } {
  if (!targetId) return { seen: 'hit something', told: 'hit something' };
  const victim = findResident(targetId);
  const object = victim ? victim.identity.name : 'one of the training dummies in the square';
  // "You saw them punch X" but "she told you they punched X".
  return { seen: `punch ${object}`, told: `punched ${object}` };
}

/**
 * A rough, spoken sense of how long ago something was. Precise times would be
 * strange in dialogue, and coarse buckets keep the prompt stable for longer.
 */
export function ago(milliseconds: number): string {
  const minutes = milliseconds / 60_000;
  if (minutes < 0.5) return 'just now';
  if (minutes < 1.5) return 'about a minute ago';
  if (minutes < 5) return 'a few minutes ago';
  if (minutes < 50) return `about ${Math.round(minutes / 5) * 5} minutes ago`;
  if (minutes < 90) return 'about an hour ago';
  if (minutes < 60 * 20) return 'earlier today';
  const days = Math.max(1, Math.round(minutes / (60 * 24)));
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** The moods a line may carry, mirroring NpcMood. */
const MOODS: readonly NpcMood[] = ['neutral', 'friendly', 'wary', 'hostile'];

/** The JSON shape the model is constrained to answer in. */
export const LINE_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'Exactly what the resident says aloud, and nothing else.' },
    mood: { type: 'string', enum: [...MOODS], description: 'How the resident feels toward the newcomer as they say it.' },
  },
  required: ['text', 'mood'],
  additionalProperties: false,
} as const;

/** Longest line accepted. The prompt asks for 35 words; this is a backstop. */
const MAX_LINE_CHARACTERS = 400;

/**
 * Validates the model's reply. Structured output makes a well-formed answer
 * near certain, but a truncated or off-script reply must fall back to canned
 * dialogue instead of reaching the screen, so it is checked rather than trusted.
 */
export function parseLine(raw: string): { text: string; mood: NpcMood } | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;

  const { text, mood } = value as { text?: unknown; mood?: unknown };
  if (typeof text !== 'string' || typeof mood !== 'string') return null;
  if (!MOODS.includes(mood as NpcMood)) return null;

  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LINE_CHARACTERS) return null;
  return { text: trimmed, mood: mood as NpcMood };
}
