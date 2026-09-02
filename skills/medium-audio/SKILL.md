---
name: medium-audio
description: "Build microphone capture, waveform visualization, recording, and playback on the web. Use when adding voice notes, dictation, voice commands, or audio feedback."
---

# Audio as a medium

## What this medium does to the person
A live microphone or a speaking app is a presence in the room. It is intimate, hands-free, and emotional, and it is also an intrusion, so it must ask, show that it is listening, and leave when told.

## When to reach for this medium
Choose audio when hands or eyes are busy, when tone matters, or when speaking beats typing. Treat a live microphone as a promise to the user.

## Core browser APIs
- `navigator.mediaDevices.getUserMedia({ audio: true })` for capture
- Web Audio: `AudioContext`, `AnalyserNode` for waveforms, `OscillatorNode` for synthesized feedback
- `MediaRecorder` for encoding; `decodeAudioData` + `AudioBufferSourceNode` for playback

## UX rules that always apply
- Nothing captures until a user gesture. Create or resume the AudioContext inside that gesture.
- Always show a live level or waveform; silence with no feedback reads as broken.
- A Stop control that releases every track, visibly.
- A working state with no microphone: permission denied, no device, or an embedded frame that blocks it.

## Reference implementation
`reference/Recorder.ts` — mic capture with waveform, MediaRecorder recording, decode-and-play playback, synthesized fallback tone, and full teardown on unmount.

## Gotchas
- Codec output differs by browser; never assume webm.
- Avoid `blob:` URLs in locked-down environments; decode to a buffer instead.
- Release tracks on unmount or the recording indicator persists.
