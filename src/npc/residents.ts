import type { NpcIdentity } from './NpcBrain.ts';
import type { ScheduleEntry } from './routine.ts';

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
  /** Where they stand, on the ground plane, when they are not walking. */
  home: [x: number, z: number];
  /**
   * Their day, as blocks of hours. Starts and ends at `home`, so the day
   * joins up without anyone walking at midnight. See `routine.ts`.
   */
  schedule: ScheduleEntry[];
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

/**
 * Everyone in town.
 *
 * Gertie stands on the square and sees what happens there; the others live by
 * their own buildings, out of sight of it, so they can only learn about the
 * square second-hand. Their friendships decide the order: Odile and Wilf hear
 * from Gertie directly, and Bram only hears once Odile has had it from her.
 */
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
    schedule: [
      { from: 0, to: 7, stands: [4, 3] },
      // Opens the bakery counter, walking the high street to the west end.
      { from: 7, to: 12, stands: [-37, -13], via: [[-30, 3], [-30, -2]] },
      // Lunch on the square.
      { from: 12, to: 18, stands: [-2, 2], via: [[-30, -2], [-30, 3]] },
      // Evenings at the inn, where Odile is.
      { from: 18, to: 21, stands: [22, -13], via: [[22, 3]] },
      { from: 21, to: 24, stands: [4, 3], via: [[22, 3]] },
    ],
    model: 'characters/chef-female.glb',
    // Odile buys her bread for the inn; Wilf grows her flour.
    neighbours: ['odile', 'wilf'],
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
  {
    identity: {
      id: 'odile',
      name: 'Odile',
      role: 'Keeps the inn on the north side of the high street. Hears every rumour that crosses her bar.',
    },
    persona:
      'A theatrical, generous host in her fifties who treats every guest as ' +
      'an audience. She loves a good story and improves every one she ' +
      'retells. Flattering, quick to laugh, and quicker to pass something ' +
      'on, though she would call it "keeping people informed". Fond of ' +
      'dramatic pauses and pet names.',
    home: [22, -12],
    schedule: [
      { from: 0, to: 8, stands: [22, -12] },
      // Buys bread from Gertie before the morning rush.
      { from: 8, to: 10, stands: [-34, -12], via: [[22, 3], [-30, 3], [-30, -2]] },
      // Gossips on the square benches.
      { from: 10, to: 12, stands: [6, -3], via: [[-30, -2]] },
      // Runs the inn from its front door through the afternoon and evening.
      { from: 12, to: 22, stands: [26, -13], via: [[22, 3]] },
      { from: 22, to: 24, stands: [22, -12] },
    ],
    model: 'characters/old-classy-female.glb',
    // Gertie's bread is on every table at the inn; Bram drinks there nightly.
    neighbours: ['gertie', 'bram'],
    smallTalk: [
      "Welcome to Clobbertown, petal. The inn's always open and the stew is mostly edible.",
      "Looking for a bed? I've three. Two of them even have all their legs.",
      'Travellers bring the best stories. You must have one or two.',
    ],
    reactions: [
      'I saw that from my window, dear. Very dramatic. Do it somewhere I can sell tickets.',
      "Again? I'll have to start charging you for the entertainment.",
      'One more and you can find somewhere else to sleep.',
    ],
  },
  {
    identity: {
      id: 'bram',
      name: 'Bram',
      role: 'The blacksmith, at the smithy on the east road. Says little and means all of it.',
    },
    persona:
      'A broad, slow-spoken man in his forties who has shod every horse in ' +
      'Clobbertown. Uses as few words as possible and never wastes one on ' +
      'flattery. Fiercely protective of the town and its people. Not ' +
      'unfriendly, simply unhurried, with a dry humour that surfaces rarely ' +
      'and without warning. Rarely uses names.',
    home: [37, -9],
    schedule: [
      { from: 0, to: 7, stands: [37, -9] },
      // At the forge all day, which is also where he lives.
      { from: 7, to: 18, stands: [34, -10] },
      // A drink at the inn, where he sees Odile.
      { from: 18, to: 20, stands: [30, -11] },
      { from: 20, to: 24, stands: [37, -9] },
    ],
    model: 'characters/worker-male.glb',
    // He only really talks to Odile, at the inn of an evening.
    neighbours: ['odile'],
    smallTalk: ['Hm. New face.', 'Mind the anvil. It bites.', 'Good steel takes time. So does trust.'],
    reactions: ['Saw that. Don\'t.', 'Twice now.', "That's enough."],
  },
  {
    identity: {
      id: 'wilf',
      name: 'Wilf',
      role: 'Farms the fields by the barn at the south-east edge of town, and grows the flour for the bakery.',
    },
    persona:
      'A cheerful, rambling farmer in his thirties who is delighted to meet ' +
      'anyone and easily alarmed by anything. Talks about his geese, his ' +
      'wheat and the weather as if they were all old friends. Believes the ' +
      'best of everyone until he is told otherwise, then worries about it ' +
      'out loud.',
    home: [29, 29.5],
    schedule: [
      { from: 0, to: 9, stands: [29, 29.5] },
      // Delivers flour to the bakery in the morning.
      {
        from: 9,
        to: 11,
        stands: [-40, -13],
        via: [[30, 8], [30, 3], [-30, 3], [-30, -2]],
      },
      {
        from: 11,
        to: 17,
        stands: [29, 29.5],
        via: [[-30, -2], [-30, 3], [30, 3], [30, 8]],
      },
      // Afternoon on the square, talking about his geese.
      { from: 17, to: 22, stands: [10, -5], via: [[30, 8], [30, 3]] },
      { from: 22, to: 24, stands: [29, 29.5], via: [[30, 3], [30, 8]] },
    ],
    model: 'characters/cowboy-male.glb',
    // Supplies Gertie's flour, and hears all her news when he delivers it.
    neighbours: ['gertie'],
    smallTalk: [
      'Lovely day for it! For what, I couldn\'t tell you, but lovely all the same.',
      "Gertie's buns? My wheat, those are. You're welcome.",
      'Mind the geese if you come round the barn. They have opinions.',
    ],
    reactions: [
      'Oh! Oh dear. Was that on purpose?',
      'You keep doing that. I wish you would not keep doing that.',
      "I'm going to have to tell someone about this, I really am.",
    ],
  },
];

/** Looks a resident up by id. */
export function findResident(id: string): Resident | undefined {
  return RESIDENTS.find((resident) => resident.identity.id === id);
}
