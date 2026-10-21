import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { BRAIN_API } from '../src/npc/brainProtocol.ts';
import { cannedDialogue } from './cannedDialogue.ts';
import { createClaudeDialogue } from './claudeDialogue.ts';
import { MemoryStore } from './MemoryStore.ts';
import { converse, forget, observe, status, type BrainServer, type Reply } from './routes.ts';

/** Largest request body accepted. Real requests are a few hundred bytes. */
const MAX_BODY_BYTES = 16 * 1024;

export interface NpcBrainOptions {
  /** Where memories are saved, relative to the project root. */
  savePath: string;
  /**
   * The Anthropic API key, read from `.env.local` by the Vite config. Without
   * one, residents speak from their canned lines; memory and gossip still work.
   */
  apiKey: string | undefined;
}

/**
 * Runs the residents' brains inside the Vite dev server, under `/api/npc`.
 *
 * Inside Vite rather than a separate process, so `npm run dev` stays the one
 * command that runs the game. Only the HTTP plumbing lives here; what each
 * endpoint does is in `routes.ts`. The routes and memory store know nothing
 * about Vite, so Phase 4 can host the same code in Electron's main process.
 */
export function npcBrainServer(options: NpcBrainOptions): Plugin {
  return {
    name: 'clobbertown-npc-brains',
    // Development only. A static build has no server, and the game copes with
    // that by falling back to offline lines.
    apply: 'serve',

    configureServer(server) {
      const log = (message: string) => server.config.logger.info(message, { timestamp: true });
      const brains: BrainServer = {
        store: new MemoryStore(resolve(server.config.root, options.savePath)),
        writer: options.apiKey ? createClaudeDialogue(options.apiKey, log) : cannedDialogue,
        now: () => Date.now(),
      };

      const { mode, model } = brains.writer.status;
      server.config.logger.info(
        mode === 'llm'
          ? `  ➜  Residents: written by ${model ?? 'the language model'}`
          : '  ➜  Residents: canned lines (add ANTHROPIC_API_KEY to .env.local for Claude)',
      );

      server.middlewares.use(BRAIN_API, (request, response) => {
        handle(brains, request, response).catch((error: unknown) => {
          server.config.logger.error(`[npc] ${String(error)}`);
          send(response, { status: 500, body: { error: 'brain server error' } });
        });
      });
    },
  };
}

async function handle(brains: BrainServer, request: IncomingMessage, response: ServerResponse) {
  // Mounted under BRAIN_API, so the URL here is only the part after it.
  const route = `${request.method ?? 'GET'} ${(request.url ?? '/').split('?')[0]}`;

  switch (route) {
    case 'GET /status':
      return send(response, status(brains));
    case 'POST /observe':
      return send(response, observe(brains, await readJson(request)));
    case 'POST /converse':
      return send(response, await converse(brains, await readJson(request)));
    case 'POST /forget':
      return send(response, forget(brains));
    default:
      return send(response, { status: 404, body: { error: `no route ${route}` } });
  }
}

/** Reads and parses a JSON body, refusing anything implausibly large. */
async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    // Malformed JSON is treated like any other malformed request: rejected by
    // the route's validation with a 400, not a crash.
    return null;
  }
}

function send(response: ServerResponse, reply: Reply): void {
  response.statusCode = reply.status;
  if (reply.body === null) {
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(reply.body));
}
