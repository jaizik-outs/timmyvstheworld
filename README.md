# Timmy vs. the World

A first playable Vite + TypeScript + Phaser 3 prototype with one Pac-Man-style maze, dollar-bill pellets, four partner ghosts, power pellets, score/lives UI, and editable Celeste-style dialogue.

## Run

```bash
npm install
npm run dev
```

## Edit Content

- Maze layout: `src/game/content/maze.ts`
- Dialogue, catch quips, Timmy's startup lifecycle, and story beats: `src/game/content/dialogue.ts`
- Speeds, scoring, colors, and timing: `src/game/config.ts`
- Partner ghost mapping and pixel-art face cues: `src/game/scenes/PrototypeScene.ts`
- Logo asset: `public/assets/outsiders-logo.svg`

Current story setup:

- Host/narrator: Jonny (`HOST_CHARACTER` in `src/game/content/dialogue.ts`)
- Player character: Timmy, a Stanford dropout trying to raise a seed round (`PLAYER_CHARACTER` in `src/game/content/dialogue.ts`)
- Final campaign destination: IPO Gauntlet
- Regular pellets: dollar bills

Partner ghost mapping:

- Austin: bald/red beard, light sweater
- Teddy: side-part hair, dark shirt
- George: dark swoop hair, dark shirt
- Kira: curly hair, black turtleneck
