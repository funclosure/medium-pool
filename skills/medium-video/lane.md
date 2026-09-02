---
slug: video
order: 3
name: Video
hook: Moving frames, live or recorded
message: The app becomes a witness; time is the content.
direction: both
substrate:
  - video element with srcObject
  - getUserMedia
  - canvas.captureStream
accent: { light: "#7A4FD1", dark: "#AE8DF2" }
instances:
  - slug: live-feed
    name: Live feed
    hook: Live frames, filters, snapshots
    module: reference/LiveVideo.ts
  - name: video.js
    by: oss
    url: https://github.com/videojs/video.js
    note: Player with a plugin ecosystem; the reference for controls, captions, and multiple sources.
  - name: hls.js
    by: oss
    url: https://github.com/video-dev/hls.js
    note: Adaptive streaming in the browser through Media Source Extensions.
---

## Why

Video is the richest live medium: a camera feed, a screen share, a rendered animation, or a file. Users judge it in milliseconds, so frame rate and startup time matter more than resolution.

The trick on the web is that a `<video>` element does not care where frames come from. A camera, a canvas, or a remote peer all arrive as a `MediaStream`, which means you can build and test the whole UI with a generated feed before you ever ask for a camera.

### Reach for it when

- the subject moves and a still would lose the point
- you need presence: calls, live previews, walkthroughs
- you are capturing something to review later

## Gotchas

- Autoplay only works muted. Set the muted property in JS, not just the attribute, or some browsers refuse.
- Use playsinline or iOS will fullscreen the element.
- Camera permission can be blocked by an embedding frame, so the generated feed must be a complete experience on its own.
- CSS filters on video are free; pixel processing costs a canvas copy per frame, so throttle it.
- Stop tracks on unmount. Detaching the element is not enough.
