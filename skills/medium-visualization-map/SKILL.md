---
name: medium-visualization-map
description: "Build an interactive map on the web: tile layers, Web Mercator projection, pan and zoom, markers, and device location. Use when adding a map, store locator, route view, or any view of geographic data. A kind of medium-visualization."
---

# Map (kind of Visualization)

## What this medium does to the person
A map makes "where" the content. Every other fact hangs off a position, and the person expects to find themselves on it.

## What this kind is
A visualization of geographic data. Inherits the lane's camera, hit testing, and emphasis; adds projection, tile pyramid, provider, and location input.

## Core building blocks
- Web Mercator: `lon/lat → world pixels at zoom z`, tile = floor(px / 256)
- A tile cache keyed `z/x/y`; wrap x, clamp y
- A provider (OpenStreetMap, MapTiler, Mapbox) with its attribution and key handled server-side or by domain restriction
- `navigator.geolocation.getCurrentPosition` behind a user gesture, with a no-location path
- Or a library that does all of the above (MapLibre GL, Leaflet), which is the right call for production

## UX rules that always apply
- Attribution visible at all times.
- Locate is a button, never automatic. Explain when it is blocked.
- Zoom and pan feel instant: draw cached tiles first, fill in fetched ones.
- Markers keep a stable pixel size across zoom levels; areas scale.

## Reference implementation
`reference/SlippyMap.ts` — projection helpers, tile cache with a generated fallback tile, drag pan and wheel zoom, marker layer, locate-me with graceful denial.

## Gotchas
- Mercator distorts area; do not compare sizes on it.
- Debounce zoom, cancel stale tile requests.
- Geolocation fails silently on many desktops; design for it.
