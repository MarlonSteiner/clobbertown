import type { NpcIdentity } from './NpcBrain.ts';

/**
 * Who lives in Clobbertown.
 *
 * The single source of truth about each resident, read by both the game (to
 * place and draw them) and the brain server (to give them a personality and a
 * memory). Pure data with no browser or Node dependencies, which is what lets
 * both sides import it, so the two can never disagree about who someone is.
 */
export interface Resident {
  identity: NpcIdentity;
  /**
   * Personality and manner of speech, written for the language model. Kept in
   * plain prose because that is what the model reads best; this is the
   * character brief an actor would get.
   */
  persona: string;
  /** Where they stand, on the ground plane. */
  home: [x: number, z: number];
  /** Character model, under `public/models/`. */
  model: string;
  /**
   * The residents they talk to, which is the path gossip travels. Friendship
   * is mutual here: `residents.test.ts` checks every link runs both ways.
   */
  neighbours: string[];
  /**
   * What they say when no language model is available: small talk, cycled in
   * order, and remarks about violence they know of, escalating with each one.
   */
  smallTalk: readonly string[];
  reactions: readonly string[];
}

export const RESIDENTS: Resident[] = [
  {
    identity: {
      id: 'gertie',
      name: 'Gertie',
      role: 'Runs the bakery on the square. Knows everyone, and tells everyone.',
    },
    persona:
      'Warm, nosy and quick-tongued, in her sixties. She has watched this ' +
      'town for forty years from behind a bread counter and considers ' +
      'knowing its business a public service. Speaks plainly, with dry ' +
      'humour, and cannot resist hinting at things she has heard. Kind to ' +
      'newcomers until given a reason not to be.',
    home: [4, 3],
    model: 'characters/chef-female.glb',
    neighbours: [],
    smallTalk: [
      "Morning. You're new, aren't you? Don't worry, everyone'll know by lunchtime.",
      'Careful round the square. People here have long memories.',
      "I'd tell you what the smith said about you, but I'm not one to gossip.",
    ],
    reactions: [
      'I saw that. What did that dummy ever do to you?',
      "Again? You'll have the whole square talking by supper.",
      'Keep that up and nobody in this town will sell you so much as a bun.',
    ],
  },
];

/** Looks a resident up by id. */
export function findResident(id: string): Resident | undefined {
  return RESIDENTS.find((resident) => resident.identity.id === id);
}
