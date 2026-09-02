---
slug: image
order: 4
name: Image
hook: Upload, transform, preview
message: The person shows instead of tells.
accent: { light: "#C98A18", dark: "#E7B24A" }
demo: reference/ImageLab.ts
examples:
  - name: screenshot-maker
    url: https://github.com/funclosure/screenshot-maker
    by: you
    note: Composes whole App Store screenshot sets from one manifest. Image as the output of a pipeline, rendered in the browser.
  - name: Squoosh
    url: https://github.com/GoogleChromeLabs/squoosh
    by: oss
    note: In-browser image compression with codecs compiled to WebAssembly. The on-device processing ideal.
  - name: Cropper.js
    url: https://github.com/fengyuanchen/cropperjs
    by: oss
    note: Cropping, rotating, and scaling with a canvas result.
---

## Why

Images are how people show an app something they cannot describe: a receipt, a whiteboard, a screenshot, a face. The medium is half about getting the file in (drop, paste, pick, capture) and half about doing something visible with it before any upload.

Everything here runs locally. A canvas gives you pixels; pixels give you filters, crops, thumbnails, and previews without a server round trip.

### Reach for it when

- the input is visual and typing it would be slower or lossy
- people need to see the result of a change before committing
- privacy matters and processing can stay on the device

## Gotchas

- Read files with FileReader as data URLs or decode with createImageBitmap; never trust the file extension.
- Large photos (12–48 MP) will freeze the tab if you run getImageData on them. Downscale first.
- EXIF orientation: phone photos may arrive rotated. Use image-orientation: from-image or createImageBitmap with imageOrientation.
- Cross-origin images taint the canvas and getImageData throws. Same-origin or CORS headers only.
- Support paste (Ctrl/Cmd+V) and drop, not just the file picker.
