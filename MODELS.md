# Models and assets

Every asset in this repository is CC0, which means it can be used for any
purpose, including commercial, with no attribution required. Attribution is
given anyway because it costs nothing and the packs are worth knowing about.

## Assets in use

| Files | Pack | Source | Licence |
| --- | --- | --- | --- |
| `public/models/buildings/suburban/house-*.glb` (8) | City Kit (Suburban) 2.0 | [Kenney](https://kenney.nl/assets/city-kit-suburban) | CC0 1.0 |
| `public/models/buildings/commercial/shop-*.glb` (6) | City Kit (Commercial) 2.1 | [Kenney](https://kenney.nl/assets/city-kit-commercial) | CC0 1.0 |
| `public/models/nature/tree-*.glb` (6) | Nature Kit | [Kenney](https://kenney.nl/assets/nature-kit) | CC0 1.0 |
| `public/models/characters/casual-male.glb`, `chef-female.glb` | Ultimate Animated Character Pack (Nov 2019) | [Quaternius](https://quaternius.com/packs/ultimatedanimatedcharacter.html) | CC0 1.0 |

Each directory carries the licence file that shipped with its pack. Those files
are the record; this table is the summary.

## Layout of `public/models`

```
buildings/
  suburban/    house-*.glb  +  Textures/colormap.png  +  LICENSE.txt
  commercial/  shop-*.glb   +  Textures/colormap.png  +  LICENSE.txt
nature/        tree-*.glb                             +  LICENSE-*.txt
characters/    *.glb                                  +  LICENSE-*.txt
```

The two building kits are in **separate directories on purpose**. Both kits'
models reference their texture by the relative path `Textures/colormap.png`,
but the two atlases are different files. Flattening the kits into one folder
makes one overwrite the other, and every building from the losing kit renders
with the wrong colours.

## How models are sized

Nothing is scaled by a hand-tuned multiplier. The layout says how much space a
thing should occupy and the model is fitted to it:

- **Buildings** are given a `footprint` in world units, and scaled uniformly to
  fit inside it. The town decides how much ground a building covers; the model
  keeps its own proportions and decides its own height.
- **Trees** and **characters** are given a `height`, and scaled to match.

The point is that swapping one model for another changes how something looks
without moving its neighbours or reopening the question of whether anything
overlaps. `src/scene/layout.test.ts` checks that no two plots collide and that
nothing is standing in a road.

Colliders are derived from each model's measured bounding box rather than
hand-written, so they cannot drift out of step with the art.

## Two repairs applied at load time

Both of these live in `src/scene/`, both are guarded so they only fire on the
broken case, and both stop applying if the packs are ever re-exported correctly.

**Trees arrive fully metallic.** Kenney's Nature Kit predates the City Kits and
its glTF export omits `metallicFactor`, which the spec defaults to `1`. A fully
metallic surface has no diffuse response: it shows only what it reflects, and
this scene has no environment map, so the trees render black or as a dim tint
of their own colour. `useModel.ts` sets metalness to 0 on any material that is
fully metallic *and* has no metalness map.

**Characters arrive with no skin colour.** Every character in the Quaternius
pack exports its `Skin` material as near-black (`0.01, 0.01, 0.01`) with a
separate near-white `Face` material over a small patch, so the townsfolk render
as silhouettes. The value is byte-identical across the pack, which is what
marks it as an export artefact rather than a decision about any particular
character. `CharacterModel.tsx` replaces it with `PALETTE.skin`; change that one
constant to change the townsfolk.

## Animation

The Quaternius characters are rigged and ship seventeen clips, including
`Punch`, `SwordSlash` and `RecieveHit`. That is why this pack was chosen over
Kenney's characters: Phase 2's combat gets its animation without another
asset hunt. Phase 1 uses only `Idle`, `Walk`, `Run` and `Jump`, chosen from the
player's speed in `src/player/playerAnimation.ts`.

## Adding more

1. Prefer these two packs. Both are CC0, both are stylistically consistent with
   what is already here, and staying inside them keeps the town coherent.
2. Put the files under `public/models/`, keeping any `Textures/` folder in the
   same relative position the pack had it.
3. Copy the pack's licence file in alongside them.
4. Add a row to the table above **when you add the file**, not later. An asset
   that is not listed here does not ship: if you cannot say where a file came
   from, delete it.
5. Reference it from `src/scene/layout.ts` (scenery) or the roster
   (`src/npc/roster.ts`) for a character.

Record the licence at the time of download, since a pack's terms can change.
Keep CC0 and non-CC0 assets clearly separated: Steam distribution in Phase 4
makes a licence mistake expensive to unwind.
