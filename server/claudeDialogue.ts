import Anthropic from '@anthropic-ai/sdk';
import { cannedDialogue } from './cannedDialogue.ts';
import { freshNews, type DialogueWriter, type LineRequest, type WrittenLine } from './DialogueWriter.ts';
import { LINE_SCHEMA, parseLine, situation, systemPrompt } from './prompt.ts';

/**
 * The model that voices the residents.
 *
 * Haiku 5.5 is the cheapest current model, at about 1/40 the price of Opus 5.5
 * per token, which is what matters once every player pays for every line. It
 * has no server-side refusal fallback, so a declined line falls back to the
 * canned list instead (see `lineRequest`).
 */
export const DIALOGUE_MODEL = 'claude-haiku-5-5';

/**
 * How long a player will wait for a reply before the resident falls back to a
 * canned line. The dialogue box shows "…" meanwhile. Short lines at low effort
 * normally take a couple of seconds; anything near this is a problem.
 */
const REQUEST_TIMEOUT_MS = 15_000;

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type Reply = Anthropic.Beta.Messages.BetaMessage;

/** Sends one request to the API. Injected, so tests can see and script every call. */
export type Send = (params: Params) => Promise<Reply>;

/**
 * Dialogue written by Claude from what each resident knows.
 *
 * Every failure, whether a network error, a timeout, a refusal or an
 * unusable reply, falls back to the canned writer. A resident always answers,
 * because a game that freezes waiting on an API is worse than one that
 * occasionally says something less clever.
 */
export function claudeDialogue(send: Send, log: (message: string) => void): DialogueWriter {
  return {
    status: { mode: 'llm', model: DIALOGUE_MODEL },

    async write(request: LineRequest): Promise<WrittenLine> {
      const name = request.resident.identity.name;
      const started = Date.now();

      try {
        const reply = await send(lineRequest(request));
        const line = readLine(reply);
        if (line) {
          log(`[npc] ${name}: ${usage(reply)}, ${Date.now() - started}ms`);
          // Whether a line counts as a reaction is decided here, from the
          // facts, not by the model: it is what stops the same news being
          // flagged as fresh forever.
          return { ...line, kind: freshNews(request).length > 0 ? 'reaction' : 'small-talk' };
        }
        log(`[npc] ${name}: unusable reply (stop: ${reply.stop_reason ?? 'none'}); using a canned line`);
      } catch (error) {
        log(`[npc] ${name}: ${explain(error)}; using a canned line`);
      }

      return cannedDialogue.write(request);
    },
  };
}

/** Builds the real client and its writer. */
export function createClaudeDialogue(apiKey: string, log: (message: string) => void): DialogueWriter {
  // One retry: enough to ride out a blip, few enough that a player is not
  // left waiting through several timeouts.
  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  return claudeDialogue((params) => client.beta.messages.create(params), log);
}

/** The request for one line. */
export function lineRequest(request: LineRequest): Params {
  const system = systemPrompt(request.resident);

  return {
    model: DIALOGUE_MODEL,
    // Thinking is always on with this model and counts against this limit, so
    // it is set well above the length of a line rather than at it; a truncated
    // reply would fail validation and waste the call.
    max_tokens: 2048,
    // Short chat lines do not benefit from deep reasoning, and low effort keeps
    // the player's wait down.
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: { ...LINE_SCHEMA, required: [...LINE_SCHEMA.required] } },
    },
    system: system.map((text, index) => ({
      type: 'text' as const,
      text,
      // Cache up to the end of the persona. Everything after it changes on
      // every call, so this is the longest prefix that can ever be reused.
      ...(index === system.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
    })),
    messages: [{ role: 'user', content: situation(request) }],
  };
}

/** The line in a reply, or null if there is not a usable one. */
function readLine(reply: Reply) {
  // A refusal has no line to read, whatever the content holds.
  if (reply.stop_reason === 'refusal') return null;
  const text = reply.content.find((block) => block.type === 'text');
  return text && text.type === 'text' ? parseLine(text.text) : null;
}

function usage(reply: Reply): string {
  const { input_tokens, output_tokens, cache_read_input_tokens } = reply.usage;
  return `${input_tokens} in + ${cache_read_input_tokens ?? 0} cached, ${output_tokens} out`;
}

/** A short explanation of a failure, most specific first. */
function explain(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'API key rejected; check ANTHROPIC_API_KEY in .env.local';
  if (error instanceof Anthropic.RateLimitError) return 'rate limited by the API';
  if (error instanceof Anthropic.APIConnectionTimeoutError) return `no reply within ${REQUEST_TIMEOUT_MS / 1000}s`;
  if (error instanceof Anthropic.APIConnectionError) return 'could not reach the API';
  if (error instanceof Anthropic.APIError) return `API error ${String(error.status)}: ${error.message}`;
  return `unexpected error: ${String(error)}`;
}
