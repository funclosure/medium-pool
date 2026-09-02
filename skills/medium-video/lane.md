---
slug: video
order: 3
name: Video
hook: Live frames, filters, snapshots
message: The app becomes a witness; time is the content.
accent: { light: "#7A4FD1", dark: "#AE8DF2" }
demo: reference/LiveVideo.ts
examples:
  - name: TimeCliper
    by: you
    private: true
    note: iOS app that loads a YouTube transcript so you clip the exact moment without scrubbing. Video bound to text by time.
  - name: video.js
    url: https://github.com/videojs/video.js
    by: oss
    note: Player with a plugin ecosystem; the reference for controls, captions, and multiple sources.
  - name: hls.js
    url: https://github.com/video-dev/hls.js
    by: oss
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
