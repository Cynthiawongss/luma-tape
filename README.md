# Luma Tape

English · [简体中文](README.zh-CN.md)

**Design your own washi tape in the browser. Pick a motif, restyle it as blur, cross-stitch or symbol art, and export a sticker for your digital journal.**

[Open the studio](https://cynthiawongss.github.io/luma-tape/)

![Luma Tape studio showing a cross-stitch Saturn tape](docs/studio-stitch.jpg)

## What you can make

Every tape starts from one of 57 motifs and can be re-rendered in four print styles. The roll, the flat preview, the library covers and the exports all come from the same print, so what you see is what you download.

| Blur | Symbol |
| --- | --- |
| ![Soft-focus, grainy print in cobalt and pink](docs/studio-blur.jpg) | ![Print typeset from rows of letters](docs/studio-symbol.jpg) |

- **Blur**: soft focus and film grain, recoloured through your palette.
- **Stitch**: outlined pixel cross-stitch on an even-weave grid, with small pixel charms.
- **Symbol**: shapes typeset from rows of letters, with small technical marks.
- **Classic**: the original watercolour illustrations.

## Features

- **57 motifs in six collections**: Places, Elements, MBTI, Zodiac, Planets and Florals, plus a blank roll.
- **Two materials**: opaque washi paper with visible fibres, or clear film with glitter that sparkles as you turn the roll.
- **Three colours per tape**: base, print and accent. *Match to base color* derives the other two for you, and *Shuffle* tries a new palette and style in one tap.
- **Draw your own**: brush, eraser, 39 stickers, text and image upload, with undo and redo.
- **My rolls**: save as many tapes as you like, rename them, delete them (with undo).
- **Three exports**:
  - Flat strip, 3072 × 512, for GoodNotes and other digital journals
  - Transparent sticker, 2400 × 1400
  - White showcase image, 2400 × 1600
- **Keyboard friendly**: arrow keys turn the roll, Home resets the view, ⌘Z / ⇧⌘Z undo and redo.
- **Shareable links**: `#/t/<motif id>` opens a motif directly.

## Your data

Everything stays in your browser. There is no account, no server and no cloud sync. Saved rolls live in `localStorage`, so export a PNG before you switch devices or clear site data.

## Run it locally

Requires Node.js 20.19 or newer.

```sh
npm ci
npm run dev
```

Check and build:

```sh
npm test
npm run build
```

## Publish

Every push to `main` runs the tests, builds the site and publishes it to GitHub Pages (see `.github/workflows/pages.yml`). If the tests or the build fail, the live site stays on the previous version.

## How it is built

React 19, Vite and Three.js. No backend.

```text
src/
  Studio.jsx        main screen, state, undo/redo, saving, exports
  Library.jsx       collections, search, masonry covers
  DrawingEditor.jsx the drawing canvas
  WorksDrawer.jsx   My rolls
  patterns.js       the print: composition and the four styles
  waterScene.js     Three.js roll, materials, export rendering
  waterGeometry.js  the continuous roll-and-tail surface
  catalog.js        motifs, collections, palettes
  works.js          save format and migration (tested)
  color.js          OKLCH palette derivation (tested)
tests/              save format, colour, material and geometry checks
```

## Scope

Luma Tape is a design tool, not a print shop: it exports images and does not order physical tape. The four styles re-render one set of 39 illustrations, so the motifs are shared across styles. Fonts load from Google Fonts and fall back to system fonts offline.
