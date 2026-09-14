# docs

Images and other material for the repository itself, not for the game. Nothing
in here is loaded at runtime — game assets live in `public/models/`.

| File | Used for |
| --- | --- |
| `banner.jpeg` | The illustration at the top of the root README. 1375×768. |
| `social-preview.png` | The repository's social preview. 1280×640, cropped from the banner. |

## Setting the social preview

This is the image shown when a link to the repository is shared. It can only be
set through the web UI; there is no API or `gh` command for it.

**Settings → General → Social preview → Edit → Upload an image**, then choose
`docs/social-preview.png`.

That file is already the 1280×640 that GitHub asks for. The banner is 16:9 and
GitHub crops previews to 2:1, so the crop was taken deliberately from the bottom
of the frame: left to itself GitHub would trim both edges evenly and cut the
characters' feet.

If the banner is ever replaced, regenerate the preview from the new art rather
than uploading the raw file.

## Provenance

Record where artwork came from and under what licence, the same way `MODELS.md`
does for the 3D assets. This repository is public and the game is intended for
commercial release, so anything with unclear rights is worth catching early.

| File | Source | Licence / rights |
| --- | --- | --- |
| `banner.jpeg` | _to be recorded_ | _to be recorded_ |
