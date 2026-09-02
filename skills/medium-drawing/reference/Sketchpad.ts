// Drawing as a medium: a pressure-aware sketchpad on a 2D canvas driven by Pointer Events.
// Strokes are kept as data (points, pressure, color, size) so undo and resize are replays.
// Framework-free. mount(root) builds the UI; unmount() disconnects the observer and drops the strokes.

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

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

type Pt = { x: number; y: number; p: number };
type Stroke = { color: string; size: number; pts: Pt[] };

const COLORS = ['#12292C', '#2B5FB3', '#D9573F', '#C98A18', '#248F63', '#7A4FD1'];

let root: HTMLElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let strokes: Stroke[] = [];
let current: Stroke | null = null;
let color = COLORS[0];
let size = 6;
let ro: ResizeObserver | null = null;

/** Size the backing store to devicePixelRatio and replay every stroke. */
function fit() {
  const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  redraw();
}

/** One segment of a stroke; pressure at the end point sets the width. */
function seg(s: Stroke, a: Pt, b: Pt) {
  ctx.strokeStyle = s.color; ctx.lineWidth = s.size * (0.35 + 1.3 * b.p);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) for (let i = 1; i < s.pts.length; i++) seg(s, s.pts[i - 1], s.pts[i]);
}

/** Pointer position in canvas CSS pixels; mouse gets a steady width, pen and touch report pressure. */
const pt = (e: PointerEvent): Pt => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'mouse' ? 0.5 : (e.pressure || 0.5) };
};

function down(e: PointerEvent) {
  canvas.setPointerCapture(e.pointerId);
  current = { color, size, pts: [pt(e)] };
  strokes.push(current);
}

function move(e: PointerEvent) {
  if (!current) return;
  const evs: PointerEvent[] = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
  for (const ev of evs) {
    const p = pt(ev);
    seg(current, current.pts[current.pts.length - 1], p);
    current.pts.push(p);
  }
}

function up() { current = null; }

const demo: Demo = {
  mount(el) {
    root = el; color = COLORS[0];
    canvas = h('canvas', { class: 'sketch', 'aria-label': 'Drawing surface' });
    ctx = canvas.getContext('2d')!;
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    const sw = h('div', { class: 'swatches', role: 'group', 'aria-label': 'Color' }, COLORS.map((c) =>
      h('button', {
        class: 'swatch', style: `background:${c}`, 'aria-pressed': c === color, 'aria-label': c,
        onclick: (e: any) => { color = c; sw.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); },
      })));
    const range = h('input', { type: 'range', min: 1, max: 24, value: size, oninput: (e: any) => { size = +e.target.value; } });
    const controls = h('div', { class: 'row' }, sw,
      h('label', { class: 'field' }, 'Brush', range),
      h('button', { class: 'btn small', onclick: () => { strokes.pop(); redraw(); } }, 'Undo'),
      h('button', { class: 'btn small', onclick: () => { strokes = []; redraw(); } }, 'Clear'));
    root.append(
      controls,
      h('div', { class: 'frame' }, canvas),
      h('div', { class: 'status' }, 'Pointer Events · pressure changes the width on pen and touch · coalesced events keep fast strokes smooth'),
    );
    fit(); ro = new ResizeObserver(fit); ro.observe(canvas);
    // a small hello so the pad is not empty at rest
    const w = canvas.clientWidth, y0 = 150;
    const hello: Stroke = { color: COLORS[1], size: 5, pts: [] };
    for (let i = 0; i <= 60; i++) hello.pts.push({ x: 40 + (w - 80) * i / 60, y: y0 + Math.sin(i / 6) * 40, p: 0.3 + 0.5 * Math.abs(Math.sin(i / 9)) });
    strokes.push(hello); redraw();
  },
  unmount() { ro?.disconnect(); ro = null; strokes = []; current = null; },
};

export default demo;
