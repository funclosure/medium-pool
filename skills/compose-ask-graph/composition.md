---
slug: ask-graph
order: 2
name: Ask-driven graph
hook: The answer lights up the map
message: Asking draws the map.
accent: { light: "#4C5FA3", dark: "#9DA9E6" }
demo: reference/AskGraph.ts
mediums: [text, visualization]
binding: answer stream → emphasis set
example: mindgraph Ask pane
examples:
  - name: mindgraph
    url: https://github.com/funclosure/mindgraph
    by: you
    note: "The Ask pane: a live agent answers over the digested graph and the canvas follows."
---

## Why

Reading is one way into a graph. Asking is the other. A person types a question, an answer streams back, and every concept the answer cites lights up on the map as it is mentioned. By the end of the answer the reader has both a paragraph and a subgraph, and they agree.

This is the pattern behind mindgraph's Ask pane, where a live agent answers over the digested graph and the canvas follows.

### The binding

- **Signal:** the answer text as it streams, token by token
- **Contract:** concepts are matched by label (or, in the real thing, by ids the model is asked to cite)
- **Effect:** the emphasis set grows as concepts are mentioned; it never shrinks mid-answer

## Gotchas

- Ask the model to cite concept ids explicitly rather than matching labels in prose. Label matching is fine for a demo and wrong for synonyms, plurals, and languages.
- Grow the emphasis set during a stream; only reset it when a new question starts. Flicker on every token is unreadable.
- Throttle graph updates to the render frame, not to every token.
- Show the answer even if the graph is empty. Text must stand alone.
- A Stop control stops both the stream and the growth of the set.
