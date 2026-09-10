# Clobbertown

A stylised low-poly brawler set in a small town where every resident remembers
what you did and tells their neighbours about it.

Built for the browser with Three.js, and intended to ship on Steam as a desktop
build later.

> **Status: Phase 1.** You can walk a character around a town, jump, sprint,
> bump into buildings, and talk to one resident. There is no combat yet.

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
downloads and compiles. The overlay says "Building the town…" until it is ready.

### Other commands

```bash
npm test        # run the unit tests
npm run build   # type-check and build for production
npm run typecheck
```

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Third-person character walking around a small town | **Current** |
| 2 | Melee combat against dummy targets | Not started |
| 3 | LLM-driven NPCs with persistent memory, and gossip between them | Not started |
| 4 | Electron wrapper and a Steam build pipeline via GitHub Actions | Not started |
| 5 | Optional co-op or PvP | Not started |

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

**Per-frame state stays out of React.** Input, velocity and player position
live in refs, and the Zustand store only holds things the interface redraws for.
Putting a position that changes 60 times a second into React state would
re-render the scene at frame rate for no benefit.

## Testing

The movement maths, the interaction range check, and the NPC brain contract are
pure functions with unit tests, so the feel of the character can be checked
without a browser or a physics world:

```bash
npm test
```

Rendering and physics integration are not unit tested. They are verified by
running the game.

## Art

Stylised low-poly cartoon: chunky proportions, flat shading, a warm and
deliberately small palette. A toy town, not a simulation.

Phase 1 uses primitives only, with no third-party assets. See
[`MODELS.md`](MODELS.md) for how to drop real models in and where to source
CC0 packs.
