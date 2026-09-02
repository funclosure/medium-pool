# Medium Pool

Every medium your app could speak. Try it, then take the skill.

Medium Pool is a kickstart guide for building a product around a medium: text, audio, video, image, drawing, visualization, 3D, and the kinds and compositions that grow from them. Each lane has a live in-browser demo and an [Agent Skill](https://agentskills.io) your coding agent can install, so the demo you touched is the code your agent starts from.

The medium is the message. Every lane names what the medium does to a person before any content arrives, and every skill leads with that.

## Install a skill

```sh
npx skills add funclosure/medium-pool                  # every skill in the pool
npx skills add funclosure/medium-pool --skill medium-text
```

Every lane, kind, and composition is a folder under `skills/`, and the folder names are the skill names. `npx skills add funclosure/medium-pool --list` shows what the CLI finds without installing anything (the CLI wants Node 22.20 or newer).

## Three levels

- **Lane**: a perceptual channel with its own substrate. `skills/medium-text`, `skills/medium-audio`, …
- **Kind**: a data domain inside a lane whose concerns diverge. `skills/medium-visualization-map` sits under Visualization.
- **Composition**: two or more lanes bound by a signal. `skills/compose-reading-graph` binds Visualization and Text by scroll position.

The contract for a folder is in [`skills/README.md`](skills/README.md). To add one, copy an existing folder, edit its manifest, `SKILL.md`, and `reference/` module, then run `bun run check`. The site picks it up at build.

## Develop

```sh
bun install
bun run dev        # http://localhost:4321
bun run check      # validates every skill folder against the contract
bun run test       # check + production build (bun run test, not bun test: that is bun's own runner)
```

Bun is the pinned package manager (`packageManager` in package.json, `bun.lock`). pnpm and npm work too; delete `bun.lock` and install with your tool. Astro 7, static output, no UI framework. Demos are vanilla TypeScript modules with a `mount(root)` / `unmount()` interface.

## Deploy

Cloudflare Pages: build command `bun run build`, output directory `dist`. Pages picks bun up from `bun.lock`. Or, logged in with wrangler:

```sh
bun run deploy
```

## Prototype

The design spec is the single-file prototype at [`docs/prototype/medium-pool.html`](docs/prototype/medium-pool.html). The site is the same page split into folders.
