import { findResident } from '../src/npc/residents.ts';
import { freshNews, type DialogueWriter, type LineRequest, type WrittenLine } from './DialogueWriter.ts';

/**
 * Dialogue from each resident's canned lists, steered by what they remember.
 *
 * This is what runs with no API key, so anyone who clones the repository can
 * still play, and it is also the fallback whenever the model call fails. It
 * reads the same persistent memory as the model does, so memory and gossip
 * work identically either way; only the wording is fixed.
 */
export const cannedDialogue: DialogueWriter = {
  status: { mode: 'canned', model: null },

  write(request: LineRequest): Promise<WrittenLine> {
    return Promise.resolve(cannedLine(request));
  },
};

export function cannedLine({ resident, said, ...rest }: LineRequest): WrittenLine {
  const news = freshNews({ resident, said, ...rest });

  if (news.length > 0) {
    const reactionsGiven = said.filter((line) => line.kind === 'reaction').length;
    const sawItThemselves = news.some((known) => known.heardFrom === null);

    if (sawItThemselves && resident.reactions.length > 0) {
      const index = Math.min(reactionsGiven, resident.reactions.length - 1);
      return { text: resident.reactions[index] ?? '...', mood: 'wary', kind: 'reaction' };
    }

    const teller = news.find((known) => known.heardFrom !== null)?.heardFrom;
    if (teller) {
      const tellerName = findResident(teller)?.identity.name ?? 'Someone';
      return {
        text: `${tellerName} tells me you've been knocking things about in the square. Is that so?`,
        mood: 'wary',
        kind: 'reaction',
      };
    }
  }

  const smallTalkGiven = said.filter((line) => line.kind === 'small-talk').length;
  const lines = resident.smallTalk;
  const text = lines.length > 0 ? (lines[smallTalkGiven % lines.length] ?? '...') : '...';
  return { text, mood: 'friendly', kind: 'small-talk' };
}
