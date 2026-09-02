---
slug: reading-graph
order: 1
name: Reading-driven graph
hook: Prose scroll reveals the graph
message: Reading becomes navigation.
direction: both
substrate:
  - Visualization + Text
  - scroll position as the binding
accent: { light: "#4C5FA3", dark: "#9DA9E6" }
mediums: [visualization, text]
binding: scroll position → emphasis set
instances:
  - slug: global-workspace-reader
    name: Global Workspace reader
    hook: Six passages, twelve concepts
    module: reference/ReadingGraph.ts
  - name: mindgraph
    by: you
    url: https://github.com/funclosure/mindgraph
    note: "The origin of this composition: scrolling the Source pane spotlights the graph."
  - name: scrollama
    by: oss
    url: https://github.com/russellsamora/scrollama
    note: Scrollytelling with IntersectionObserver. The scroll-to-step resolver, generalized.
---

## Why

A concept graph on its own is a map without a route. Prose on its own is a route without a map. Bind them and the reader gets both: they read at their own pace, and the graph lights up the concepts the current passage is about.

This is the pattern behind mindgraph, where a digested transcript becomes a force-directed graph plus a Source pane, and scrolling the prose spotlights the graph.

### The binding

- **Signal:** the reader's scroll position, resolved to one active passage
- **Contract:** each passage declares the concept ids it is about
- **Effect:** the graph's emphasis set becomes those ids; everything else dims

## Gotchas

- Resolve scroll to one passage with a fixed reading line (around 40% down the pane), not to whatever is intersecting. Two passages half-visible must not fight.
- Passages declare ids; the graph never parses prose. Keep the contract in data so the two sides can evolve separately.
- Emphasis changes should be calm: dim, do not remove. Layout must not jump when the set changes.
- Auto-scroll is a convenience, not the default. Reading speed belongs to the reader.
- Both parts must work alone. The graph without prose is still the Visualization lane; the prose without the graph is still readable text.
