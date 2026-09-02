# Medium Pool Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Amendment after execution (2026-09-02):** compositions live under `skills/compose-*/`, not a separate `compositions/` directory, because the skills CLI only scans `skills/` by default (finding them elsewhere needs `--full-depth`, which nobody will pass). Composition modules therefore import `../../medium-visualization/reference/ForceGraph`. Everything else below executed as written.

**Goal:** Turn the approved single-file prototype into a real repo: an Astro site that discovers skill folders at build time, plus one folder per lane, kind, and composition holding a manifest, a `SKILL.md`, and the reference demo module the site actually runs.

**Architecture:** Content lives in `skills/*/lane.md` and `compositions/*/composition.md` (frontmatter = manifest, body = Why + Gotchas). Astro content collections glob those folders, so a new folder is a new page with no site code change. Each folder's `reference/*.ts` exports `{ mount(root), unmount() }`; the site imports it as a client script for the stage, and the `SKILL.md` points an agent at the same file. The site is static, deployed to Cloudflare Pages.

**Tech Stack:** Astro 7.2 (static output, content layer, zod schemas), TypeScript, vanilla DOM demos (no UI framework), three.js from npm for the 3D lane, Node 22 test script, Playwright MCP for the click-through, Cloudflare Pages via `wrangler pages deploy`.

**Spec:** the published prototype `medium-pool.html` (artifact `b66901f5-a67f-4316-904f-b3ea490aa5f2`; copy committed at `docs/prototype/medium-pool.html`). Its `MEDIUMS`, `COMPOSITIONS`, `EXAMPLES`, `MSG` data and its demo modules are the source for every task below. Copy content verbatim; port code, do not redesign.

## Global Constraints

- Node `>=22.12.0` (Astro 7 floor). Package manager: bun (bun.lock committed); pnpm and npm also work.
- No UI framework. Demos are vanilla TypeScript modules with the interface in Task 1.
- Skill folder name == `SKILL.md` frontmatter `name` (Agent Skills rule). Naming scheme: lanes `medium-<id>`, kinds `medium-<lane>-<kind>`, compositions `compose-<id>`.
- Site URLs: lane `/<id>`, kind `/<lane>/<kind>`, composition `/<id>`.
- Design tokens, fonts (Albert Sans display, IBM Plex Sans body, IBM Plex Mono code), per-lane accents, and copy come from the prototype unchanged.
- "The medium is the message" stays a lens: every manifest has `message`, every `SKILL.md` leads with "What this medium does to the person" (or "this composition"), McLuhan credited once in the site footer.
- Every demo degrades gracefully with no camera, mic, location, or CDN; never opens a dialog.
- Nothing external at runtime except Google Fonts.
- `tsconfig` extends `astro/tsconfigs/base`; demos are typed against the `Demo` interface but not under strict.

---

## File structure

```
medium-pool/
├── package.json                 scripts: dev, build, preview, check, test, deploy
├── astro.config.mjs             site URL, static output
├── tsconfig.json
├── src/
│   ├── content.config.ts        lanes + compositions collections, zod schema = manifest contract
│   ├── layouts/Base.astro       head, fonts, tokens, header, footer (McLuhan credit)
│   ├── styles/global.css        tokens + component classes lifted from the prototype
│   ├── components/
│   │   ├── LaneTile.astro       tile with living canvas preview
│   │   ├── CompositionTile.astro
│   │   ├── Stage.astro          demo panel + message line + kind switcher
│   │   ├── ContextTabs.astro    Why · Gotchas · In the wild · Skill
│   │   └── CopyButton.astro
│   ├── scripts/
│   │   ├── tiles.ts             living tile previews (site-only, one rAF loop)
│   │   ├── stage.ts             loads the demo module for the page, mount/unmount on pagehide
│   │   └── copy.ts              clipboard with fallback
│   ├── lib/
│   │   ├── catalog.ts           reads both collections, resolves lane→kinds, examples, skill paths
│   │   └── skillText.ts         raw SKILL.md loader (import.meta.glob ?raw)
│   └── pages/
│       ├── index.astro          hero + Mediums rail + Compositions rail
│       └── [...slug].astro      lane, kind, and composition pages
├── skills/
│   ├── README.md                the contract: folder layout, manifest fields, demo interface
│   ├── medium-text/
│   │   ├── lane.md              frontmatter manifest + ## Why + ## Gotchas
│   │   ├── SKILL.md
│   │   └── reference/StreamingText.ts
│   ├── medium-audio/            … Recorder.ts
│   ├── medium-video/            … LiveVideo.ts
│   ├── medium-image/            … ImageLab.ts
│   ├── medium-drawing/          … Sketchpad.ts
│   ├── medium-visualization/    … ForceGraph.ts (exports makeGraph + CONCEPTS too)
│   ├── medium-visualization-map/… SlippyMap.ts
│   └── medium-webgl/            … OrbitScene.ts
├── compositions/
│   ├── compose-reading-graph/   composition.md, SKILL.md, reference/ReadingGraph.ts
│   └── compose-ask-graph/       composition.md, SKILL.md, reference/AskGraph.ts
├── scripts/check-skills.mjs     validates every folder against the contract
└── docs/superpowers/plans/      this file
```

## Contracts (all tasks depend on these)

**Manifest frontmatter (`lane.md` / `composition.md`)**

```yaml
id: text                      # url slug; for kinds the kind slug (map)
name: Text
hook: Streams, renders, never blocks
message: The app becomes quotable, and streaming makes it feel like it is thinking with you.
accent: { light: "#2B5FB3", dark: "#78A4EE" }
demo: reference/StreamingText.ts
lane: visualization           # kinds only: parent lane id
mediums: [visualization, text]# compositions only
binding: scroll position → emphasis set   # compositions only
example: mindgraph            # compositions only, optional
examples:
  - { name: mindsizer, url: https://github.com/funclosure/mindsizer, by: you, note: "…" }
  - { name: TimeCliper, by: you, private: true, note: "…" }
```

Body: `## Why` section (prose, may include `### Reach for it when` list) then `## Gotchas` (bullet list). The page splits rendered HTML at the Gotchas heading.

**Demo module interface (`reference/*.ts`)**

```ts
export interface Demo { mount(root: HTMLElement): void; unmount(): void; }
const demo: Demo = { mount(root) { … }, unmount() { … } };
export default demo;
```

`root` is an empty `<div class="demo">` inside an element that defines `--accent` and `--ink`. Modules may use these site classes: `row btn btn.primary btn.small seg chips chip field status status.warn frame out md caret meter swatches swatch sketch snaps drop graph map compose reader`. Modules inline their own tiny `h()` helper and markdown renderer where needed; the only cross-folder import allowed is compositions importing `makeGraph`/`CONCEPTS` from `../../../skills/medium-visualization/reference/ForceGraph.ts`.

**Accent per lane (light / dark):** text `#2B5FB3/#78A4EE`, audio `#D9573F/#F0846E`, video `#7A4FD1/#AE8DF2`, image `#C98A18/#E7B24A`, drawing `#248F63/#4FC38F`, visualization and its kinds `#B4407C/#E07DB4`, webgl `#1794B0/#4CC3DE`, compositions `#4C5FA3/#9DA9E6`.

---

### Task 1: Repo base and the folder contract check

**Files:** Create `package.json` (edit scaffolded), `astro.config.mjs`, `src/content.config.ts`, `scripts/check-skills.mjs`, `skills/README.md`, `README.md`, `CLAUDE.md`, `.gitignore` (keep scaffolded), init git.

**Interfaces:** Produces `getCatalog()` inputs: collections `lanes` (from `skills/*/lane.md`) and `compositions` (from `compositions/*/composition.md`) with the schema above. Produces `npm run check` that fails on any contract violation.

- [ ] Step 1: `package.json` scripts: `dev: astro dev`, `build: astro build`, `preview: astro preview`, `check: node scripts/check-skills.mjs`, `test: npm run check && astro check`, `deploy: wrangler pages deploy dist --project-name medium-pool`. Add `@astrojs/check` and `typescript` as devDependencies.
- [ ] Step 2: `astro.config.mjs`: `site: 'https://medium-pool.pages.dev'`, `output: 'static'`.
- [ ] Step 3: `src/content.config.ts` with the zod schema for both collections, `glob({ pattern: '*/lane.md', base: './skills' })` and `glob({ pattern: '*/composition.md', base: './compositions' })`, `generateId` returning the folder name.
- [ ] Step 4: `scripts/check-skills.mjs`: for every `skills/*` and `compositions/*` dir: `SKILL.md` exists, its frontmatter `name` equals the dir name, `lane.md`/`composition.md` exists with `id`, `name`, `hook`, `message`, `accent`, `demo`, the `demo` file exists, the SKILL body contains `## What this` (medium|composition) `does to the person`. Exit 1 with a list on failure. Run it against an empty tree: expect "0 folders checked".
- [ ] Step 5: `skills/README.md` documents the contract section above verbatim. `README.md` explains the site, the three levels, how to add a lane/kind/composition, and the McLuhan lens. `CLAUDE.md` is the short orientation for agents (where things live, run `npm run check` before committing).
- [ ] Step 6: `git init`, no commit yet (the user decides when to commit).

### Task 2: Site shell, index, and catalog pages

**Files:** Create `src/styles/global.css`, `src/layouts/Base.astro`, `src/lib/catalog.ts`, `src/lib/skillText.ts`, `src/components/*.astro`, `src/scripts/{tiles,stage,copy}.ts`, `src/pages/index.astro`, `src/pages/[...slug].astro`. Replace scaffolded `public/favicon.svg` with a pool glyph.

**Interfaces:** Consumes the two collections. Produces `getCatalog(): { lanes: Lane[], compositions: Composition[] }` where `Lane = { id, name, hook, message, accent, demoPath, skillName, skillPath, examples, kinds: Lane[], body }`. Produces route slugs: lane `/text`, kind `/visualization/map`, composition `/reading-graph`.

- [ ] Step 1: Lift the prototype `<style>` into `global.css` unchanged, minus the font picker rules. Tokens on `:root`, dark under `prefers-color-scheme` and `[data-theme="dark"]`. Accent indirection: elements with class `themed` get `--accent-light`/`--accent-dark` inline from the manifest; `.themed { --accent: var(--accent-light) }` and inside both dark blocks `.themed { --accent: var(--accent-dark) }`.
- [ ] Step 2: `Base.astro`: fonts link, `global.css`, header with the hero copy (the McLuhan subline) and install line, footer with repo tree and the credit.
- [ ] Step 3: `catalog.ts`: `getCollection('lanes')`, split into lanes (`!data.lane`) and kinds (`data.lane`), attach kinds to their lane, compute `skillName = entry.id` (folder), `skillPath = skills/<folder>/SKILL.md`, `demoPath = /skills/<folder>/<demo>` module id for `import.meta.glob`.
- [ ] Step 4: `index.astro`: Mediums rail (`LaneTile` per lane with kinds chips) and Compositions rail (`CompositionTile` with part chips and binding). `tiles.ts` ports the `tileDraw` functions keyed by lane id, one shared rAF loop, static frame under reduced motion, and a default drawer (accent dot grid) for any id without one so a new folder never breaks the loop.
- [ ] Step 5: `[...slug].astro`: `getStaticPaths` from the catalog; renders `Stage` (title, kind switcher as links, message line, `<div class="demo" data-demo="<module id>">`) and `ContextTabs` (Why/Gotchas from `entry.rendered.html` split at `<h2 id="gotchas">`, In the wild from `examples`, Skill from raw `SKILL.md` with copy buttons and the install line `npx skills add funclosure/medium-pool --skill <folder>`).
- [ ] Step 6: `stage.ts`: merge `import.meta.glob('/skills/*/reference/*.ts')` and `import.meta.glob('/compositions/*/reference/*.ts')` into one map; on load, import the module for `data-demo`, call `mount(root)`; on `pagehide`, `unmount()`.
- [ ] Step 7: `npm run build` with no folders yet: expect a successful build with only the index page.

### Tasks 3–12: one folder per lane, kind, and composition

Same shape each time; the table gives the specifics. Content comes from the prototype's entry with the same id.

| Task | Folder | Reference module | Notes |
|---|---|---|---|
| 3 | `skills/medium-text` | `StreamingText.ts` | inline `renderMd`, canned answers |
| 4 | `skills/medium-audio` | `Recorder.ts` | AudioContext in gesture, decode-and-play, no blob URLs |
| 5 | `skills/medium-video` | `LiveVideo.ts` | generated feed default, camera opt-in |
| 6 | `skills/medium-image` | `ImageLab.ts` | generated sample, three filters |
| 7 | `skills/medium-drawing` | `Sketchpad.ts` | pointer events, DPR, undo/clear |
| 8 | `skills/medium-visualization` | `ForceGraph.ts` | also `export function makeGraph`, `export const CONCEPTS` |
| 9 | `skills/medium-visualization-map` | `SlippyMap.ts` | `lane: visualization`, generated tiles |
| 10 | `skills/medium-webgl` | `OrbitScene.ts` | `import * as THREE from 'three'` (npm), one renderer kept for the page |
| 11 | `compositions/compose-reading-graph` | `ReadingGraph.ts` | imports `makeGraph`, `CONCEPTS` |
| 12 | `compositions/compose-ask-graph` | `AskGraph.ts` | imports `makeGraph`, `CONCEPTS` |

- [ ] Step 1: Write `lane.md` (or `composition.md`): frontmatter from the prototype entry (`id`, `name`, `hook`, `message`, `accent`, `demo`, `examples`, and `lane`/`mediums`/`binding` where relevant); body = the prototype `why` HTML converted to markdown under `## Why`, then `## Gotchas` with the prototype bullets.
- [ ] Step 2: Write `SKILL.md` = the prototype `skill` string with `name:` set to the folder name and the "What this … does to the person" section kept as the first section.
- [ ] Step 3: Port the demo to `reference/<Module>.ts` implementing `Demo`, inlining the helpers it uses (`h`, `esc`, `renderMd`, `accentOf`, `inkOf`, `reduceMotion`). Keep behavior identical.
- [ ] Step 4: `npm run check` passes for this folder. `npm run build` succeeds and `dist/<slug>/index.html` exists.
- [ ] Step 5: Open `/<slug>` in the Playwright browser, confirm the demo mounts with no console errors.

### Task 13: End-to-end verification and deploy notes

- [ ] Step 1: `npm test` passes (check + astro check).
- [ ] Step 2: `npm run build && npm run preview`; click every tile on the index, every kind switch, every tab; console has no errors; body never scrolls horizontally at 375px.
- [ ] Step 3: Confirm the skills CLI discovers the folders: `npx skills add ./ --list` (or the CLI's equivalent) from a scratch dir; record the exact working command in `README.md`, replacing the placeholder flag if it differs.
- [ ] Step 4: README deploy section: Cloudflare Pages, build `npm run build`, output `dist`, or `npm run deploy` with wrangler logged in.
