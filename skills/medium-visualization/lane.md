---
slug: visualization
order: 6
name: Visualization
hook: Graphs, charts, spatial data
message: The whole is visible before the parts.
accent: { light: "#B4407C", dark: "#E07DB4" }
demo: reference/ForceGraph.ts
examples:
  - name: mindgraph
    url: https://github.com/funclosure/mindgraph
    by: you
    note: A force-directed concept graph on one 2D canvas, with layout, hit testing, camera, and emphasis all hand-rolled.
  - name: D3
    url: https://github.com/d3/d3
    by: oss
    note: "The toolkit for data-driven documents: forces, scales, shapes, and the vocabulary everyone else borrows."
  - name: Cytoscape.js
    url: https://github.com/cytoscape/cytoscape.js
    by: oss
    note: Graph theory library with layouts and analysis for node-link views.
  - name: sigma.js
    url: https://github.com/jacomyal/sigma.js
    by: oss
    note: WebGL renderer for graphs too large for a 2D canvas.
---

## Why

Visualization is the medium where the picture is computed from data. Node-link graphs, timelines, charts, maps. Nobody draws it; the app lays it out, and the person explores it by dragging, hovering, zooming, and selecting.

It shares a canvas with Drawing and nothing else. The concerns are layout (a force simulation here), hit testing, a camera, and emphasis: making the part that matters right now stand out from the rest.

### Reach for it when

- the content is a structure: relations, sequences, positions, quantities
- people need to see the whole and then find their part of it
- the picture must update as the data changes

## Gotchas

- Keep the simulation and the drawing separate. Layout mutates positions; draw reads them. Mixing them makes every feature a physics bug.
- Hit testing in screen space, not data space. Apply the camera transform in both directions or dragging drifts.
- Emphasis is a set, not a single selected node. Most real questions light up a subgraph.
- Damp the simulation and let it settle, or the page never stops burning CPU. Stop the loop entirely when it has converged.
- Labels are the accessibility story. A canvas is a bitmap to a screen reader, so mirror the node list in the DOM or an aria description.
