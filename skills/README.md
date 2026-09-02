# The folder contract

Every lane, kind, and composition in Medium Pool is one folder under `skills/`, because that is the one directory the skills CLI scans by default. The folder name is the skill name; the manifest file (`lane.md` or `composition.md`) says which level it is. The site discovers folders at build time, so adding one never touches `src/`. `bun run check` enforces everything on this page.

## Three levels

| Level | What makes one | Folder | Manifest |
|---|---|---|---|
| Lane | a distinct perceptual channel with its own browser substrate (text, audio, video, image, drawing, visualization, 3D) | `skills/medium-<id>/` | `lane.md` |
| Kind | a data domain inside a lane whose concerns diverge enough to mislead if merged into the lane's skill (visualization → map) | `skills/medium-<lane>-<kind>/` with `lane: <lane>` | `lane.md` |
| Composition | two or more lanes bound by a signal (scroll, an answer stream, time, shared state) | `skills/compose-<id>/` | `composition.md` |

Rules that keep it bounded: a new lane needs a new sense or substrate. A new kind needs a skill that would mislead if merged. A composition needs a binding signal, not just two things on one screen. Realtime is a binding signal, not a medium.

## Files in a folder

```
skills/medium-text/
├── lane.md                 manifest (frontmatter) + ## Why + ## Gotchas (body)
├── SKILL.md                what an agent reads; name must equal the folder name
└── reference/StreamingText.ts   a pool instance: the site runs it, the skill cites it
```

## The model

A medium, a kind, or a composition is a **class**. What runs on its page is an **instance** of it, one way to build the class, never the class itself. Instances in the pool have a `module` the site mounts. Instances in the wild have a maker (`by`) and a URL. Same thing, different address. The one question for an instance: is it just another way to build the same class? Then it is one more entry in `instances`, no new folder.

## Manifest frontmatter

```yaml
slug: text                        # url slug; for a kind, the kind's slug (map)
order: 1                          # position on the rail (lower first); optional
name: Text
hook: Words people read, quote, and search      # class hook: what the medium is
message: The app becomes quotable, and streaming makes it feel like it is thinking with you.
direction: both                   # in (the person gives it), out (the app shows it), both
substrate: [DOM, ReadableStream or Server-Sent Events, aria-live]
accent: { light: "#2B5FB3", dark: "#78A4EE" }
lane: visualization               # kinds only: parent medium slug
mediums: [visualization, text]    # compositions only
binding: scroll position → emphasis set   # compositions only
instances:
  - slug: streamed-answer         # pool instance: the site mounts its module
    name: Streamed answer
    hook: Streams, renders, never blocks      # instance hook: what this one does
    module: reference/StreamingText.ts
  - name: streamdown              # wild instance: a maker and a URL
    by: oss                       # you | oss
    url: https://github.com/vercel/streamdown
    note: A markdown renderer built for streaming.
```

`message` is the McLuhan line: one sentence on what the class does to a person before any content. The site shows it under the stage title. A class with two or more pool instances gets an instance switcher on its stage.

The body has a `## Why` section (prose, optionally a `### Reach for it when` list) followed by `## Gotchas` (a bullet list). The page splits them into two tabs.

## SKILL.md

Agent Skills format: frontmatter `name` (equal to the folder) and `description`, then the body. The first section after the H1 must be `## What this medium does to the person` (or `## What this composition does to the person`). Then when to reach for it, the core browser APIs, UX rules that always apply, `## Reference instances` (each one way to speak the medium, cited as evidence, never as the medium), and gotchas.

## The demo module

```ts
export interface Demo { mount(root: HTMLElement): void; unmount(): void }
const demo: Demo = { mount(root) { /* build the UI into root */ }, unmount() { /* release media, cancel loops */ } };
export default demo;
```

- `root` is an empty `<div class="demo">` whose ancestors define `--accent` and `--ink` as CSS custom properties.
- Modules are vanilla TypeScript, framework-free, and self-contained: inline the small helpers you need. The one allowed cross-folder import is a composition importing `makeGraph` and `CONCEPTS` from `skills/medium-visualization/reference/ForceGraph.ts`.
- These site classes are available for layout: `row btn btn.primary btn.small seg chips chip field status status.warn frame out md caret meter swatches swatch sketch snaps drop graph map compose reader`.
- Degrade gracefully with no camera, microphone, location, or network. Never open a dialog. Release every track and cancel every animation frame in `unmount()`.
