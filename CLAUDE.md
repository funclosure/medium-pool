# Medium Pool: agent orientation

A static Astro 7 site plus one folder per lane, kind, and composition. Read `skills/README.md` before touching any folder; it is the contract `bun run check` enforces.

## Where things live

- `skills/medium-*/` lanes and kinds: `lane.md` (manifest + Why + Gotchas), `SKILL.md`, `reference/<Demo>.ts`
- `skills/compose-*/` bindings between lanes: `composition.md`, `SKILL.md`, `reference/<Demo>.ts` (they live under skills/ so the skills CLI finds them)
- `src/content.config.ts` the manifest schema; `src/lib/catalog.ts` turns collections into pages
- `src/pages/[...slug].astro` renders every folder; `src/pages/index.astro` the rails
- `docs/prototype/medium-pool.html` the approved design spec; copy content from it, do not redesign

## Rules

- Skill folder name equals `SKILL.md` `name`. Lanes `medium-<id>`, kinds `medium-<lane>-<kind>`, compositions `compose-<id>`.
- Every manifest has `message` (the McLuhan line); every `SKILL.md` leads with "What this medium does to the person".
- Demos are vanilla TypeScript, self-contained, `{ mount(root), unmount() }`, and degrade with no camera, mic, location, or network.
- Package manager is bun. Run `bun run check` and `bun run build` before committing (`bun run test` does both). Commit only when asked.
