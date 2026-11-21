# spot-the-difference-20261121-entry

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/breinzzy/spot-the-difference-20261121-entry/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/breinzzy/spot-the-difference-20261121-entry/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Pasar Malam — Spot the Difference: a complete spot-the-difference game that runs offline in a desktop browser from static files. Two near-identical pictures side by side, circle the differences before the clock runs out. Three original Indonesian scenes, 29 differences, timer, hints and combos.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rp1x5e31&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>

## How to play

- Click a difference in either panel — left or right, both count.
- Find them all before the timer runs out. A wrong click costs 5 seconds.
- `H` spends a hint (3 per level), `M` mutes the sound, `Esc` pauses.
- Chains of finds build a combo multiplier; finishing with time left earns
  a time bonus and up to 3 stars per level.

## Levels

1. **Warung Kopi Pagi** — a morning coffee stall, 7 differences, 2:00.
2. **Pasar Malam** — a night market under string lights, 10 differences, 2:30.
3. **Pulau Mercusuar Senja** — a lighthouse island at dusk, 12 differences, 3:00.

All art is drawn procedurally on canvas from the game's own code — no
image, audio or font file is loaded, and the game makes no network request.
Sound effects are synthesized with WebAudio.

## Layout

- `game/index.html` — the page: HUD header, stage canvas, footer.
- `game/style.css` — HUD styling.
- `game/src/main.js` — boot and the game loop.
- `game/src/scenes.js` — the three scenes and their differences.
- `game/src/render.js` — the procedural scene painter (draws both panels).
- `game/src/differences.js` — hit-testing clicks against differences.
- `game/src/state.js` — screens, timer, score, combo, hints, stars.
- `game/src/input.js` — mouse and keyboard.
- `game/src/ui.js` — the DOM HUD and the canvas screens.
- `game/src/audio.js` — synthesized sound effects.
- `game/src/shots.js` — the `?shot=` states used for the screenshots.
- `game/src/random.js` — seeded random helpers.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`.
- `screenshots/` — four real renders of the game (the first is the cover).
- `shots.json` — the `?shot=` query behind each screenshot.
