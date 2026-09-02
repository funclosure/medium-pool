---
slug: map
order: 1
name: Map
hook: Tiles, projection, location
message: Where is the content.
accent: { light: "#B4407C", dark: "#E07DB4" }
demo: reference/SlippyMap.ts
lane: visualization
examples:
  - name: MapLibre GL JS
    url: https://github.com/maplibre/maplibre-gl-js
    by: oss
    note: Vector tiles on WebGL; the open successor to Mapbox GL and the default for production.
  - name: Leaflet
    url: https://github.com/Leaflet/Leaflet
    by: oss
    note: The small raster-tile classic. The slippy map this demo imitates.
  - name: deck.gl
    url: https://github.com/visgl/deck.gl
    by: oss
    note: Large-scale geospatial layers on WebGL, on top of a base map.
---

## Why

A map is a visualization whose data domain is the surface of the Earth. It shares the lane's concerns (a camera, hit testing, emphasis) and adds its own: a projection from longitude and latitude to pixels, a pyramid of image tiles fetched from a provider, and a new input, the device's location.

That last part is why Map is a kind and not just a demo. Its skill has to cover tile services, attribution, keys, projections, and a permission prompt, none of which the general visualization skill should carry.

### Reach for it when

- where something is matters more than what it is
- people will pan, zoom, and locate themselves
- the data has coordinates, not just relations

This demo generates its own tiles in the page so it needs no tile provider. The projection, the tile grid, the zoom pyramid, and the marker math are the real thing.

## Gotchas

- Web Mercator is the tile standard, and it is wrong near the poles and for area comparisons. Say so in the UI when it matters.
- Tiles are addressed z/x/y and wrap in x, not in y. Clamp latitude, wrap longitude.
- Attribution is a license term for almost every tile provider, not a courtesy. Render it always.
- Geolocation needs HTTPS and a user gesture, can be blocked by an embedding frame, and returns nothing on desktops without a fix. The map must work without it.
- Do not fetch tiles for zoom levels the user is flying through. Debounce zoom, cancel stale requests, cache what came back.
