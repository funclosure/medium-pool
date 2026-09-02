---
name: medium-drawing
description: "Build freeform drawing, annotation, and whiteboard surfaces on the web with Pointer Events and 2D canvas. Use when adding sketching, markup, or signatures. For data-driven node-link graphs and charts use medium-visualization instead."
---

# Drawing as a medium

## What this medium does to the person
Drawing makes the app a surface the hand thinks on. Latency and pressure fidelity decide whether it feels like a tool or a form; structure gets out of the way of the gesture.

## When to reach for this medium
Choose drawing when people need to mark, point, sketch, or sign, and when structure would slow the gesture down. If the picture is computed from data rather than drawn by a hand, that is visualization, not drawing.

## Core browser APIs
- Pointer Events (`pointerdown`/`move`/`up`) with `setPointerCapture` and `getCoalescedEvents()`
- `pressure`, `tiltX`/`tiltY`, and `pointerType` for pen-aware rendering
- 2D canvas with a `devicePixelRatio`-scaled backing store; `ResizeObserver` to refit

## UX rules that always apply
- Strokes appear under the pointer with no visible lag; render incrementally, redraw fully only on undo or resize.
- Pressure changes the width on pen and touch; mouse gets a steady width.
- Undo and Clear are always visible. Undo removes the last stroke, not the last pixel.
- Keep strokes as data so resize, export, and sync are replays.

## Reference implementation
`reference/Sketchpad.ts` — pressure-aware brush, coalesced-event smoothing, swatches and size, undo and clear from a stroke list, DPR-correct backing store.

## Gotchas
- `touch-action: none` on the surface or the page scrolls.
- Without DPR scaling everything looks blurry.
- Never store only pixels; you lose undo and resolution.
