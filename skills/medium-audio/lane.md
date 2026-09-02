---
slug: audio
order: 2
name: Audio
hook: Sound the app hears and makes
message: The app becomes a voice in the room, with the intimacy and the intrusion of one.
direction: both
substrate:
  - getUserMedia
  - Web Audio
  - MediaRecorder
accent: { light: "#D9573F", dark: "#F0846E" }
instances:
  - slug: voice-recorder
    name: Voice recorder
    hook: Capture, visualize, play back
    module: reference/Recorder.ts
  - name: wavesurfer.js
    by: oss
    url: https://github.com/katspaugh/wavesurfer.js
    note: Waveform rendering and interaction over Web Audio and audio elements.
  - name: Tone.js
    by: oss
    url: https://github.com/Tonejs/Tone.js
    note: Web Audio framework for synthesis and scheduling. The test-tone path, grown up.
---

## Why

Voice is the medium people already have; no keyboard, no reading. Audio lets an app listen (dictation, voice notes, commands) and speak (narration, alerts, generated speech). It is also the medium with the strongest privacy expectations: a live microphone is a promise.

On the web the whole pipeline is available: `getUserMedia` to capture, Web Audio to analyze and synthesize, `MediaRecorder` to encode.

### Reach for it when

- hands or eyes are busy (driving, cooking, walking)
- tone and emotion carry information that text loses
- input is faster spoken than typed, like long notes

## Gotchas

- An AudioContext must be created or resumed inside a user gesture, or it stays suspended and silent.
- Embedded frames can block the microphone via Permissions-Policy before the user ever sees a prompt. Design the no-mic state first.
- MediaRecorder codecs differ: Chrome gives webm/opus, Safari gives mp4/aac. Decode with decodeAudioData instead of assuming a format.
- Stop every track when the user leaves, or the red recording indicator stays on and trust is gone.
- Show the waveform. Silence with no feedback reads as broken.
