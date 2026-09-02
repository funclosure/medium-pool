---
slug: webgl
order: 7
name: 3D
hook: Objects you can walk around
message: The thing has a back.
direction: out
substrate:
  - WebGL through three.js
  - one renderer per page
accent: { light: "#1794B0", dark: "#4CC3DE" }
instances:
  - slug: orbit-viewer
    name: Orbit viewer
    hook: Orbit, light, material
    module: reference/OrbitScene.ts
  - name: three.js
    by: oss
    url: https://github.com/mrdoob/three.js
    note: The library this demo runs on.
  - name: react-three-fiber
    by: oss
    url: https://github.com/pmndrs/react-three-fiber
    note: three.js as React components, with the pmndrs ecosystem around it.
  - name: Babylon.js
    by: oss
    url: https://github.com/BabylonJS/Babylon.js
    note: A full engine when a scene graph is not enough.
---

## Why

3D is the medium for things that exist in space: products, rooms, molecules, maps, game worlds. It answers questions a flat picture cannot, like what is behind, how big, how does it fit. It is also the most expensive medium in every dimension: bundle size, GPU time, battery, and authoring.

On the web that means WebGL (and increasingly WebGPU) through a library like three.js. The library is the easy part; the discipline is in resource management, because the browser hands you a small number of GPU contexts and will not give them back easily.

### Reach for it when

- spatial relationships are the content
- people need to rotate, zoom, or walk through something
- a still render would raise more questions than it answers

## Gotchas

- Browsers cap live WebGL contexts (around 16). Create one renderer and reuse it; never one per mount.
- Dispose geometries, materials, and textures explicitly. Garbage collection does not free GPU memory.
- Pin the library version in package.json and import it; a floating version changes the renderer under you.
- Cap devicePixelRatio at 2 or phones will render 3× pixels and throttle within seconds.
- Auto-rotation should respect prefers-reduced-motion.
