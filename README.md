![Three boxing-gloved characters squaring up in the cobbled square of a busy medieval town](docs/banner.jpeg)

# Clobbertown

> ### 🚧 Work in progress
>
> This is an early prototype, not a playable game. Phase 1 of five is done:
> you can walk around a town, jump, sprint, bump into buildings, and talk to
> one resident. **There is no combat yet**, which is most of what the game is
> eventually meant to be. Expect things to change, break, and get rewritten.

A stylised low-poly brawler set in a small town where every resident remembers
what you did and tells their neighbours about it.

Built for the browser with Three.js, and intended to ship on Steam as a desktop
build later.

## Running it

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Then open the URL Vite prints, click to play, and use:

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around |
| `Shift` | Sprint |
| `Space` | Jump |
| `E` | Talk to a resident |
| `Esc` | Release the mouse and pause |

The click-to-play screen is not decoration: browsers only grant pointer lock in
response to a real user gesture, so the game cannot capture the mouse on load.

The first load takes a few seconds while Rapier's WebAssembly physics engine
compiles and the models download, around 4MB in total. The overlay says
"Building the town…" until everything is ready, and cannot be clicked through
before then.

### Other commands

```bash
npm test        # run the unit tests
npm run build   # type-check and build for production
npm run typecheck
```

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Third-person character walking around a small town | ✅ Done |
| 2 | Melee combat against dummy targets | ⬜ Not started |
| 3 | LLM-driven NPCs with persistent memory, and gossip between them | ⬜ Not started |
| 4 | Electron wrapper and a Steam build pipeline via GitHub Actions | ⬜ Not started |
| 5 | Optional co-op or PvP | ⬜ Not started |

Phase 3 is the one the whole design hangs on, and the architecture is already
shaped around it — see the NPC interface below.

## How the code is arranged

```
src/
  config/        Every tuning value and colour, in one place
  scene/         The town: layout data, buildings, ground, lighting
  player/        Character controller, movement maths, follow camera
  input/         Keyboard and pointer-lock handling
  npc/           The NPC brain interface and its Phase 1 stub
  interaction/   Proximity detection and the talk-to-someone flow
  state/         Zustand store, for UI-facing state only
  ui/            HTML drawn over the 3D scene
```

Three decisions are worth knowing before you read anything else.

**All tuning lives in [`src/config/tuning.ts`](src/config/tuning.ts).** Walk
speed, jump height, camera distance, camera smoothing, interaction range. If a
number would change how the game feels, it is in that file and nowhere else, so
the game can be feel-tested by editing one file.

**The NPC interface is the one abstraction built ahead of need.**
[`src/npc/NpcBrain.ts`](src/npc/NpcBrain.ts) is the seam Phase 3 slots into.
Phase 1 ships `StubNpcBrain`, which returns canned lines and forgets
everything. Two details exist purely to protect the eventual swap:

- `converse()` returns a `Promise` even though the stub could answer
  synchronously, because a real brain is a network round-trip and a synchronous
  signature would mean rewriting every call site later.
- `observe()` exists with no consumer, because it is how Phase 2's combat will
  report what the player did, and how Phase 3's NPCs will gossip. Without it,
  memory has no way in.

**Per-frame state stays out of React.** Input, velocity, player position and
the current animation clip all live in refs, and the Zustand store only holds
things the interface redraws for. Putting a position that changes 60 times a
second into React state would re-render the scene at frame rate for no benefit.

## Testing

The movement maths, animation selection, the interaction range check, the town
layout and the NPC brain contract all have unit tests, so the feel of the
character and the arrangement of the town can be checked without a browser or a
physics world. The layout tests are worth knowing about: they check that no two
building plots overlap and that nothing is standing in a road, which is tedious
to verify by walking around and easy to break by nudging one number.

```bash
npm test
```

Rendering and physics integration are not unit tested. They are verified by
running the game.

## Art

Stylised low-poly cartoon: chunky proportions, a warm and deliberately small
palette. A toy town, not a simulation.

The buildings and trees are Kenney's City Kit and Nature Kit; the townsfolk are
Quaternius's Ultimate Animated Character Pack. Everything is CC0. The ground,
streets and square are still primitives, since no pack covers them.

Models are not scaled by hand: the layout says how much space a thing should
occupy and the model is fitted to it, and colliders are measured from the
model rather than written out separately. See [`MODELS.md`](MODELS.md) for the
full asset list, the directory layout, and the two material bugs that are
repaired at load time.
