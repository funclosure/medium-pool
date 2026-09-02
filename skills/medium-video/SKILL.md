---
name: medium-video
description: "Build live video on the web from camera, canvas, or stream sources, with filters and snapshots. Use when adding camera capture, live previews, video calls, or recorded walkthroughs."
---

# Video as a medium

## What this medium does to the person
Video makes the app a witness. Time itself becomes the content: what happened, in what order, at what pace. People judge it in milliseconds and forgive resolution before they forgive lag.

## When to reach for this medium
Choose video when motion carries the meaning or when presence matters. Optimize for time-to-first-frame and steady frame rate before resolution.

## Core browser APIs
- `<video autoplay muted playsinline>` with `srcObject` for any `MediaStream`
- `getUserMedia({ video })` for the camera; `canvas.captureStream(fps)` for generated or processed feeds
- CSS `filter` for cheap looks; 2D canvas `drawImage(video)` for snapshots and pixel work

## UX rules that always apply
- Build the UI on a generated feed first so it works with no camera and no permission.
- Show the source and its state (camera, generated, paused) in words, not just an icon.
- Snapshot and record controls should be one tap and confirm visibly.
- Release the camera the moment the user leaves the feature.

## Reference instances
Each is one way to speak this medium, cited as evidence. None of them is the medium.

`reference/LiveVideo.ts` — generated feed via captureStream as the default source, camera opt-in with a graceful denial path, CSS filter switching, and snapshot strip. It uses a few layout class names from the pool's stylesheet (`row`, `btn`, `status`, `frame`); without that stylesheet the logic still runs and the controls are unstyled.

## Gotchas
- Set `video.muted = true` in JS for autoplay to succeed.
- Frame-by-frame pixel processing needs throttling; CSS filters do not.
- Stopping tracks is the only way to turn the camera indicator off.
