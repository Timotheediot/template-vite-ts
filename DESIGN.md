# NIGHTDRIVE — Game Design Document

A retro synthwave racing game built with **Phaser 3 (v4 API) + Vite + TypeScript**,
inspired by the mood of Kavinsky's *Nightcall* era (Testarossa, night drive,
neon coastline) and the classic pseudo-3D racer **OutRun** (Sega, 1986).

> This is a fan-made, non-commercial homage. It does **not** include any
> copyrighted music, fonts, or artwork from Kavinsky, SEGA, or Rockstar/GTA.
> All audio/visuals are original or procedurally generated, and the game name,
> car design, and UI are original interpretations of the shared 80s aesthetic.

## 1. References analyzed

From the supplied OutRun screenshots (Mega Drive port) we extracted the core
UX language to replicate:

- **HUD layout**: `TIME` (top-left), `SCORE` (top-center), `STAGE`/lap info
  (top-right), all in a chunky pixel font on a dark bar.
- **Pseudo-3D road**: pinched horizon, alternating light/dark stripes on the
  road and rumble strips, road curves left/right and undulates over hills.
- **Scenery**: palm trees, roadside signs, ocean/mountains backdrop, painted
  in flat pixel-art bands (sky/sea/mountains/road).
- **Player car**: seen from behind/three-quarter, leans into curves, kicks up
  dust/tire smoke, red convertible silhouette (our Ferrari Testarossa nod).
- **Obstacles**: parked cars in lanes that must be dodged; collisions spin the
  car out and cost time.
- **"EXTENDED PLAY"/checkpoint** banner when reaching a distance milestone.

## 2. Concept

**Title:** Nightdrive — Neon Coast Run
**Genre:** Endless pseudo-3D arcade racer
**Pitch:** Drive a neon-red Testarossa down an endless coastal night highway,
dodge parked cars, chain curves, and outrun the clock as the night gets
faster and more dangerous — synthwave dream, arcade rules.

## 3. Core loop

1. Player starts with a TIME bank (60s).
2. Distance driven increases SCORE (and a speed bonus multiplier).
3. Every distance milestone = new **STAGE**, adds bonus TIME, raises speed
   cap/obstacle density (difficulty ramps like OutRun's stage progression,
   but infinite instead of a fixed 5 stages).
4. Steering off-road onto the grass rumble strongly slows the car.
5. Colliding with a parked car spins the car out, costs time and a chunk of
   speed.
6. Game ends when TIME hits 0. Final SCORE is compared to the localStorage
   high score.

## 4. Controls

| Input | Action |
|---|---|
| `←` / `→` or on-screen left/right buttons | Steer |
| `↑` / on-screen "GAS" | Accelerate (risk: less reaction time) |
| `↓` / on-screen "BRAKE" | Brake (safer through sharp curves) |
| `Space` / `Enter` / tap | Confirm on menus |

Touch controls are rendered automatically on touch-capable devices.

## 5. Technical approach

- **Road rendering**: classic OutRun-style pseudo-3D projection. The track is
  a list of fixed-length 3D segments (position, curvature, hill) projected to
  screen space each frame from the camera's Z position, drawn far-to-near as
  trapezoids with alternating stripe colors. See `src/game/road/Road.ts`.
- **Procedural pixel-art assets**: since no image assets were provided, all
  sprites (car, traffic, palm tree, sign) are generated once at boot time via
  `Phaser.GameObjects.Graphics.generateTexture` into crisp low-res textures
  (pixelArt render mode, nearest-neighbor scaling), matching the Mega Drive
  reference look. This keeps the project asset-free and easy to reskin later
  by dropping real files into `public/assets` and swapping the texture keys.
- **Typography**: Google Fonts **"Press Start 2P"** (SIL Open Font License,
  free to use) stands in for the unlicensed GTA/Pricedown-style display font,
  loaded via `<link>` in `index.html` and used for all HUD/menu text.
- **Scenes**: `Boot` → `Preloader` (generates textures/font wait) →
  `MainMenu` → `Game` → `GameOver`, matching the template's existing scene
  structure.
- **Persistence**: high score stored in `localStorage` under
  `nightdrive-highscore`.

## 6. File map

```
src/game/
  main.ts                 # Phaser game config (scene list, renderer opts)
  constants.ts             # Tunable gameplay/road constants
  assets/TextureFactory.ts # Procedural pixel-art texture generation
  road/Road.ts             # Pseudo-3D road model + segment projection
  objects/Traffic.ts       # Parked-car obstacle placement/collision
  scenes/Boot.ts
  scenes/Preloader.ts
  scenes/MainMenu.ts
  scenes/Game.ts
  scenes/GameOver.ts
```

## 7. Future extension ideas (not in MVP)

- Swap procedural textures for real hand-drawn/AI-generated pixel art.
- Original synthwave background track (composed, not sampled) + engine SFX.
- Weather/time-of-day variation, tunnels, tunnels-with-neon, bridges.
- Combo/drift scoring, nitro boost pickup.
