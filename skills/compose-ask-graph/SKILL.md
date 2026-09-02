---
name: compose-ask-graph
description: "Bind a streamed answer to a concept graph so cited concepts light up as they are mentioned. Use when building question-answer surfaces over a digested graph, knowledge map, or concept timeline. Composes medium-text and medium-visualization."
---

# Ask-driven graph

## What this composition does to the person
Bound by the answer stream, a question becomes a way of drawing the map. Each answer leaves a lit subgraph behind, so curiosity has a visible trail.

## What this composition is
A question box, a streamed answer, and a concept graph. As the answer arrives, each concept it cites joins the graph's emphasis set. The pattern behind mindgraph's Ask pane.

## Parts (install these first)
- `medium-text` for the input and the incrementally rendered answer
- `medium-visualization` for the graph and `setEmphasis(ids)`

## The binding contract
- The answer producer cites concepts by id (in a demo, by label match).
- On each render frame, the emphasis set is the union of everything cited so far in this answer.
- A new question resets the set. Stop freezes it.

## UX rules that always apply
- The set grows, never flickers. Update on frames, not on tokens.
- The answer is readable without the graph; the graph is explorable without the answer.
- Keep the last answer's emphasis until the next question starts.

## Reference implementation
`reference/AskGraph.ts` — question chips, streamed markdown answer, label-to-id resolver, frame-throttled emphasis growth on a ForceGraph from the visualization skill.

## Gotchas
- Ids over labels in production.
- Union, not replace, during a stream.
- Text stands alone.
