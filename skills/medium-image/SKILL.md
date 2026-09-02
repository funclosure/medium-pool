---
name: medium-image
description: "Build image input and on-device processing on the web: drop, paste, pick, preview, filter, crop, thumbnail. Use when adding photo upload, screenshots, avatars, or visual input."
---

# Image as a medium

## What this medium does to the person
Images let a person show instead of tell. The app becomes something you can hand things to: a receipt, a whiteboard, a face. Processing on the device keeps that gesture private.

## When to reach for this medium
Choose images when the input is visual, when people must preview a change before committing, or when processing should stay on the device.

## Core browser APIs
- `<input type="file" accept="image/*">`, drag-and-drop, and paste events for getting files in
- `FileReader` / `createImageBitmap` to decode; 2D canvas `getImageData` / `putImageData` for pixel work
- `canvas.toBlob()` for exporting thumbnails and processed results

## UX rules that always apply
- Accept drop, paste, and pick. Say so in the drop zone.
- Show the file name, dimensions, and size once loaded.
- Downscale before pixel work so the tab never freezes; say when you did.
- Process locally by default and tell the user the image never leaves the browser.

## Reference instances
Each is one way to speak this medium, cited as evidence. None of them is the medium.

`reference/ImageLab.ts` — drop zone with picker fallback, generated sample image at rest, grayscale, pixelate, and threshold filters on ImageData, with parameter sliders. It uses a few layout class names from the pool's stylesheet (`row`, `btn`, `status`, `frame`); without that stylesheet the logic still runs and the controls are unstyled.

## Gotchas
- Never run getImageData on a full-resolution phone photo.
- Handle EXIF orientation or portrait photos land sideways.
- Cross-origin images taint the canvas.
