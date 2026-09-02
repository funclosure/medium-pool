// Map as a kind of visualization: a slippy map with generated tiles, Web Mercator projection, and geolocation.
// Framework-free. mount(root) builds the UI; unmount() releases the observer and the tile cache.

export interface Demo { mount(root: HTMLElement): void; unmount(): void }

type Attrs = Record<string, string | boolean | number | ((e: any) => void) | null | undefined>;
type Kid = Node | string | null | undefined | Kid[];

/** Tiny element helper: h('button', { class: 'btn', onclick }, 'Send') */
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k.startsWith('aria-')) el.setAttribute(k, String(v));
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of (kids as unknown[]).flat(Infinity) as (Node | string | null | undefined)[]) {
    if (kid != null) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return el;
}

const accentOf = (el: Element) => getComputedStyle(el).getPropertyValue('--accent').trim() || '#B4407C';

type Place = { name: string; lon: number; lat: number };

const T = 256, R = 128;
let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, status: HTMLElement;
let ro: ResizeObserver | undefined, drag: { x: number; y: number } | null = null;
const cache = new Map<string, HTMLCanvasElement>();
let center = { lon: 121.56, lat: 25.03 }, z = 4, you: Place | null = null;
const places: Place[] = [{ name: 'Taipei', lon: 121.56, lat: 25.03 }, { name: 'Tokyo', lon: 139.69, lat: 35.69 }, { name: 'San Francisco', lon: -122.42, lat: 37.77 }, { name: 'London', lon: -0.13, lat: 51.51 }, { name: 'Nairobi', lon: 36.82, lat: -1.29 }];

/** Web Mercator: lon/lat to world pixels at zoom zz. */
const world = (lon: number, lat: number, zz: number) => { const s = T * (1 << zz), la = lat * Math.PI / 180; return { x: (lon + 180) / 360 * s, y: (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * s }; };
const unworld = (x: number, y: number, zz: number) => { const s = T * (1 << zz), yy = Math.PI - 2 * Math.PI * y / s; return { lon: x / s * 360 - 180, lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(yy) - Math.exp(-yy))) }; };

// deterministic value noise in normalized world space so tiles agree across zoom levels
const hash = (x: number, y: number) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
const noise = (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x: number, y: number) => { let s = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { s += a * noise(x * f, y * f); a *= .5; f *= 2.1; } return s; };

/** One z/x/y tile, generated once and cached. */
function tile(zz: number, tx: number, ty: number): HTMLCanvasElement {
  const key = `${zz}/${tx}/${ty}`; const hit = cache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = R; c.height = R; const g = c.getContext('2d')!, img = g.createImageData(R, R), d = img.data, sz = 1 << zz;
  for (let py = 0; py < R; py++) for (let px = 0; px < R; px++) {
    const nx = (tx + px / R) / sz * 8, ny = (ty + py / R) / sz * 8, e = fbm(nx, ny), i = (py * R + px) * 4;
    let r: number, gg: number, b: number;
    if (e < 0.5) { const t = e / 0.5; r = 30 + 40 * t; gg = 70 + 80 * t; b = 120 + 90 * t; }
    else if (e < 0.53) { r = 214; gg = 200; b = 150; }
    else if (e < 0.72) { const t = (e - 0.53) / 0.19; r = 92 - 30 * t; gg = 150 - 40 * t; b = 80 - 20 * t; }
    else { const t = Math.min(1, (e - 0.72) / 0.15); r = 120 + 120 * t; gg = 115 + 125 * t; b = 100 + 140 * t; }
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); cache.set(key, c); return c;
}

function draw() {
  const w = canvas.clientWidth, hh = canvas.clientHeight, c0 = world(center.lon, center.lat, z), left = c0.x - w / 2, top = c0.y - hh / 2, sz = 1 << z, acc = accentOf(canvas);
  ctx.clearRect(0, 0, w, hh); ctx.imageSmoothingEnabled = true;
  for (let tx = Math.floor(left / T); tx <= Math.floor((left + w) / T); tx++) for (let ty = Math.floor(top / T); ty <= Math.floor((top + hh) / T); ty++) {
    if (ty < 0 || ty >= sz) continue;
    const wx = ((tx % sz) + sz) % sz, x = tx * T - left, y = ty * T - top;
    ctx.drawImage(tile(z, wx, ty), x, y, T, T);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, T, T);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.fillText(`${z}/${wx}/${ty}`, x + 6, y + 14);
  }
  const pins = you ? [...places, you] : places;
  for (const pl of pins) {
    const p = world(pl.lon, pl.lat, z); let x = p.x - left; const y = p.y - top; const W = T * sz; x = ((x % W) + W) % W; if (x > w) x -= W;
    ctx.fillStyle = pl === you ? '#1794B0' : acc; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '600 12px IBM Plex Sans, sans-serif'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.strokeText(pl.name, x + 10, y + 4); ctx.fillText(pl.name, x + 10, y + 4);
  }
  status.textContent = `zoom ${z} · center ${center.lon.toFixed(2)}, ${center.lat.toFixed(2)} · Web Mercator · ${cache.size} tiles generated in-page so the demo needs no tile provider`;
}
function fit() { const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1; canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); }
function setZoom(nz: number) { z = Math.max(1, Math.min(8, nz)); draw(); }
function flyTo(pl: Place) { center = { lon: pl.lon, lat: pl.lat }; setZoom(Math.max(z, 5)); }
async function locate(btn: HTMLButtonElement) {
  btn.disabled = true;
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }) : rej(new Error('unsupported')));
    you = { name: 'You', lon: pos.coords.longitude, lat: pos.coords.latitude }; flyTo(you);
  } catch (e: any) { status.classList.add('warn'); status.textContent = e.code === 1 ? 'Location blocked (by you, or by this embedded frame). The map still works; location is only an input to it.' : `Location unavailable: ${e.message || e.code}. The map still works.`; return; }
  finally { btn.disabled = false; }
  status.classList.remove('warn');
}

const demo: Demo = {
  mount(root) {
    canvas = h('canvas', { class: 'map', 'aria-label': 'Slippy map with generated tiles' }); ctx = canvas.getContext('2d')!;
    status = h('div', { class: 'status' });
    const locBtn = h('button', { class: 'btn primary', onclick: () => locate(locBtn) }, 'Locate me');
    root.append(h('div', { class: 'row' }, locBtn,
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Zoom' }, h('button', { onclick: () => setZoom(z - 1), 'aria-label': 'Zoom out' }, '−'), h('button', { onclick: () => setZoom(z + 1), 'aria-label': 'Zoom in' }, '+')),
      h('div', { class: 'chips' }, places.map((pl) => h('button', { class: 'chip', type: 'button', onclick: () => flyTo(pl) }, pl.name)))),
      h('div', { class: 'frame' }, canvas), status);
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', (e) => { if (!drag) return; const c0 = world(center.lon, center.lat, z); const nc = unworld(c0.x - (e.clientX - drag.x), Math.max(0, Math.min(T * (1 << z), c0.y - (e.clientY - drag.y))), z); center = nc; drag = { x: e.clientX, y: e.clientY }; draw(); });
    const up = () => { drag = null; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(z + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
    fit(); ro = new ResizeObserver(fit); ro.observe(canvas);
  },
  unmount() { ro?.disconnect(); ro = undefined; drag = null; cache.clear(); you = null; },
};

export default demo;
