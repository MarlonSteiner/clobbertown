# Models and assets

## Current state

Clobbertown's Phase 1 town is built entirely from Three.js primitives. There
are **no third-party assets in this repository**, and nothing here needs
attribution yet.

That is a deliberate Phase 1 choice rather than an oversight. The point of this
phase is to tune how the character moves, and a town of boxes is a better
backdrop for that than a detailed one: it loads instantly, it renders fast
enough to feel the difference when a tuning value changes, and it makes
collision bugs obvious rather than hiding them behind geometry.

## How to drop real models in

The scene was structured so that models can replace primitives one building at
a time, without touching rendering code.

Every building in [`src/scene/layout.ts`](src/scene/layout.ts) is a
`BuildingSpec` with an optional `model` field:

```ts
{ id: 'bakery', position: [-33, -18], /* ... */ model: 'models/bakery.glb' }
```

Setting `model` is the seam. `src/scene/Building.tsx` currently always builds a
primitive; wiring it up means loading the GLTF when `model` is set and falling
back to the primitive when it is not. The collider should stay an explicit
cuboid rather than being fitted to the mesh, because hull-fitting a pitched
roof produces a surface the player can walk up.

Put asset files in `public/models/`, so Vite serves them as-is and Phase 4's
Electron build can load them from disk.

## Where to get assets

Both of these are CC0, which means no attribution is legally required, though
it costs nothing to give it. **Record every pack you actually use in the table
below at the point you add it**, not later.

| Source | Licence | Notes |
| --- | --- | --- |
| [Kenney](https://kenney.nl/assets) | CC0 1.0 | The "Survival Kit", "City Kit" and "Holiday Kit" packs are the closest match for a chunky low-poly town. |
| [Quaternius](https://quaternius.com/) | CC0 1.0 | Good ultimate-pack style buildings, nature and characters; the animated character packs will matter from Phase 2. |

## Assets in use

| Asset | Pack | Source | Licence | Used for |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |

## Rules for this file

- An asset that is not listed here does not ship. If you cannot say where a
  file came from, delete it.
- Record the licence at the time of download, since a pack's terms can change.
- Keep CC0 and non-CC0 assets clearly separated. Steam distribution in Phase 4
  makes a licence mistake expensive to unwind.
