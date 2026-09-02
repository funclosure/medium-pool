---
slug: drawing
order: 5
name: Drawing
hook: Marks a hand makes
message: The hand thinks, and the app is the surface it thinks on.
direction: in
substrate:
  - Pointer Events with pressure
  - 2D canvas
accent: { light: "#248F63", dark: "#4FC38F" }
instances:
  - slug: sketchpad
    name: Sketchpad
    hook: Draw, annotate, whiteboard
    module: reference/Sketchpad.ts
  - name: Excalidraw
    by: oss
    url: https://github.com/excalidraw/excalidraw
    note: Hand-drawn style whiteboard; the state of the art for collaborative sketching.
  - name: perfect-freehand
    by: oss
    url: https://github.com/steveruizok/perfect-freehand
    note: Pressure-sensitive stroke outlines from pointer input. The math behind brushes that feel right.
  - name: tldraw
    by: oss
    url: https://github.com/tldraw/tldraw
    note: Infinite canvas SDK with a full editor on top.
---

## Why

Drawing is the freeform medium: sketching, annotation, whiteboards, signatures. The input is a pen, a finger, or a mouse, and the output is whatever you render. It is the medium that feels most like a physical tool, so latency and pressure fidelity decide whether it feels good.

The 2D canvas API is small, but the input layer around it (Pointer Events, coalesced events, pressure, palm rejection) is where the craft is.

### Reach for it when

- people need to point at or mark up something spatially
- the output is a picture, a sketch, or a signature
- structure would get in the way of a quick gesture

## Gotchas

- Use Pointer Events, not mouse or touch events, so pen, finger, and mouse share one code path.
- Set touch-action: none on the canvas or the page will scroll instead of drawing.
- Scale the backing store by devicePixelRatio or strokes look blurry on every modern screen.
- Read getCoalescedEvents() during fast strokes or you get polygons instead of curves.
- Keep strokes as data (points, pressure, color) so undo, resize, and export are replays, not pixel surgery.
