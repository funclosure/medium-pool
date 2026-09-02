---
name: medium-pool
description: "Choose the medium a product or feature should speak before building it. Use when a feature is being designed and the medium is not decided, when weighing text, audio, video, image, drawing, visualization, or 3D against each other, or when a request names a medium loosely (a chat, a map, a whiteboard, a viewer). Then read the matching medium-* or compose-* skill for the build."
---

# Medium Pool: choosing the medium

## The lens: the medium is the message
A medium changes a person before any content does (McLuhan, Understanding Media, 1964). Streaming text makes an app feel present; a live microphone makes it a voice in the room; a map makes "where" the content. Choosing the medium is the product decision, not a delivery detail. Pick it for what it does to the person, then build it.

## Four primitives, one question each
- **Medium**: a channel between the app and a person, with its own sense or browser substrate. *Does it reach the person through a new sense or a new substrate?*
- **Kind**: a medium specialized by data domain, with a skill of its own. *Would merging its skill into the parent's skill mislead you?*
- **Composition**: two or more mediums the person perceives separately, coupled by a binding signal. *Is there a signal that makes the parts move together?* Realtime is a signal, not a medium.
- **Instance**: one concrete way to build a class. *Is it just another way to build the same class?* Then it is an instance, not a new class.

Every skill in this pool describes a class. Its reference module is one instance, cited as evidence, never as the medium.

## The pool
<!-- pool:start -->
| Read this skill | It is | Direction | What it is | What it does to the person |
|---|---|---|---|---|
| `medium-text` | Text, medium | both | Words people read, quote, and search | The app becomes quotable, and streaming makes it feel like it is thinking with you. |
| `medium-audio` | Audio, medium | both | Sound the app hears and makes | The app becomes a voice in the room, with the intimacy and the intrusion of one. |
| `medium-video` | Video, medium | both | Moving frames, live or recorded | The app becomes a witness; time is the content. |
| `medium-image` | Image, medium | in | A still the person hands you | The person shows instead of tells. |
| `medium-drawing` | Drawing, medium | in | Marks a hand makes | The hand thinks, and the app is the surface it thinks on. |
| `medium-visualization` | Visualization, medium | out | A picture computed from data | The whole is visible before the parts. |
| `medium-webgl` | 3D, medium | out | Objects you can walk around | The thing has a back. |
| `medium-visualization-map` | Map, kind of visualization | both | The Earth’s surface as the data | Where is the content. |
| `compose-reading-graph` | Reading-driven graph, composition (visualization + text, bound by scroll position → emphasis set) | both | Prose scroll reveals the graph | Reading becomes navigation. |
| `compose-ask-graph` | Ask-driven graph, composition (text + visualization, bound by answer stream → emphasis set) | both | The answer lights up the map | Asking draws the map. |
<!-- pool:end -->

## How to choose
1. Write one sentence on what the feature must do to the person. Match it against the messages above; that is the medium.
2. Check direction. If the person gives it, the medium is `in`; if the app shows it, `out`. A mismatch means you picked the wrong lane.
3. If the data has a domain of its own (geography, quantities, time), look for a kind. If two mediums must move together, look for a composition and install its parts first.
4. Read the chosen skill. Its reference instance is a working module; copy the structure, not the styling.

## Gotchas
- Compositions import the graph engine from the sibling `medium-visualization` folder. Install both, or the import fails.
- Reference modules use a few layout class names from the pool's stylesheet (`row`, `btn`, `status`, `frame`). Without that stylesheet the logic still runs; the controls are unstyled.
- A demo is an instance. Do not treat "streamed answer" as the whole of Text, or "slippy map" as the whole of Map.
