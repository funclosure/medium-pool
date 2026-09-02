---
name: compose-reading-graph
description: "Bind a scrolling text to a concept graph so the active passage sets the graph's emphasis. Use when building reading surfaces over transcripts, essays, or papers where a map of concepts should follow the reader. Composes medium-visualization and medium-text."
---

# Reading-driven graph

## What this composition does to the person
Bound by scroll, prose and graph turn reading into navigation: the reader moves through the text and watches where they are on the map of ideas.

## What this composition is
Prose and a concept graph, bound by scroll position. The reader scrolls; one passage is active; the graph emphasizes that passage's concepts. The pattern behind mindgraph's Source pane and graph canvas.

## Parts (install these first)
- `medium-visualization` for the graph: layout, hit testing, and `setEmphasis(ids)`
- `medium-text` for the passages and their markup

## The binding contract
- Each passage carries `data-ids`, the concept ids it is about.
- A reading line at 40% of the pane's height picks the single active passage on every scroll event.
- The active passage's ids become the graph's emphasis set. Nothing else changes; layout stays put.

## UX rules that always apply
- Dim, never hide, the concepts outside the active set.
- Mark the active passage in the prose too, so both sides agree visibly.
- Optional auto-read scrolls slowly and stops at the end; the reader can always take over.

## Reference implementation
`reference/ReadingGraph.ts` — passage list with ids, reading-line resolver, and a ForceGraph from the visualization skill driven through `setEmphasis`.

## Gotchas
- Fixed reading line, not intersection ratios.
- Ids live in data, never inferred from text at runtime.
- Keep the two parts independently usable.
