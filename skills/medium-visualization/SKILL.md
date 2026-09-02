---
name: medium-visualization
description: "Build data-driven graphs, charts, and spatial views on the web with a 2D canvas: layout simulation, hit testing, camera, and emphasis. Use when adding node-link graphs, concept maps, timelines, or explorable charts."
---

# Visualization as a medium

## What this medium does to the person
Visualization shows the whole before the parts. People see structure first, then find their place in it. The app becomes a map of something that had no shape before.

## When to reach for this medium
Choose visualization when the picture is computed from data and people explore it rather than draw it. Structure, relations, and quantities are the content.

## Core browser APIs
- 2D canvas with a `devicePixelRatio`-scaled backing store and a translate/scale camera
- `requestAnimationFrame` loop that runs a layout step then a draw step
- Pointer Events for drag, hover, and select, with hit testing in screen space
- `ResizeObserver` so the view refits when its container changes

## UX rules that always apply
- Something readable in the first frame: seed positions on a circle, never all at the origin.
- Hover highlights, drag moves, click selects. Keep those three consistent everywhere.
- Emphasis is a set of ids; dim everything outside it rather than hiding it.
- Mirror labels in the DOM for screen readers and search.

## Reference instances
Each is one way to speak this medium, cited as evidence. None of them is the medium.

`reference/ForceGraph.ts` — force-directed layout (repulsion, springs, centering, damping), drag and hover hit testing, weighted nodes, a `setEmphasis(ids)` API, add and shake helpers. The same module is composed by `skills/compose-reading-graph`. It uses a few layout class names from the pool's stylesheet (`row`, `btn`, `status`, `frame`); without that stylesheet the logic still runs and the controls are unstyled.

## Gotchas
- Separate simulation from drawing.
- Transform pointer coordinates through the camera before hit testing.
- Stop the loop once the layout settles.
