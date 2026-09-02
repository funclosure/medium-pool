---
name: medium-webgl
description: "Build interactive 3D scenes on the web with three.js: orbit controls, lighting, materials, and safe GPU resource handling. Use when adding product viewers, spatial visualizations, or 3D playgrounds."
---

# 3D as a medium

## What this medium does to the person
3D gives the thing a back. People stop reading and start handling: rotate, approach, look behind. The app becomes an object rather than a page.

## When to reach for this medium
Choose 3D when spatial relationships are the content and people need to rotate, zoom, or move through it. Expect it to be the most expensive medium you ship.

## Core browser APIs
- WebGL via three.js (`WebGLRenderer`, `Scene`, `PerspectiveCamera`, lights, `MeshStandardMaterial`), imported from npm (`import * as THREE from 'three'`) and pinned in package.json
- Pointer Events for a small custom orbit; `ResizeObserver` to resize the renderer and camera aspect
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`

## UX rules that always apply
- Something visible within the first frame: a lit object, not a black box.
- Drag to orbit is the baseline interaction; say so in words near the canvas.
- Auto-rotate only when `prefers-reduced-motion` is not set, and provide a toggle.
- Fall back to a message, not a blank space, if WebGL is unavailable.

## Reference instances
Each is one way to speak this medium, cited as evidence. None of them is the medium.

`reference/OrbitScene.ts` — single shared renderer reused across mounts, torus knot with matte, metal, and normal materials, wireframe toggle, drag-to-orbit, reduced-motion aware auto-rotate. It uses a few layout class names from the pool's stylesheet (`row`, `btn`, `status`, `frame`); without that stylesheet the logic still runs and the controls are unstyled.

## Gotchas
- One renderer for the page. Mount attaches its canvas; unmount detaches it.
- Dispose materials when you swap them.
- Import three.js from npm and pin its version in package.json; there is no CDN script and no global `THREE`.
