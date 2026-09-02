// Visualization as a medium: a force-directed concept graph laid out and drawn on one 2D canvas.
// Framework-free. mount(root) builds the UI; unmount() stops the simulation.
// makeGraph and CONCEPTS are the shared engine that the text-bound compositions import.

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
const inkOf = (el: Element) => getComputedStyle(el).getPropertyValue('--ink').trim() || '#1A1A1A';

// ---------- shared force-directed graph engine ----------

export type GraphNode = { id: string; label: string; w?: number };
export type GraphData = { nodes: GraphNode[]; links: [string, string][] };
export interface Graph {
  nodes: any[]; links: any[];
  setEmphasis(ids: string[]): void;
  setLabels(v: boolean): void;
  shake(): void;
  add(label: string, toId?: string): any;
  destroy(): void;
}

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number };
type SimLink = { a: SimNode; b: SimNode };

/** Lays out `data` on `canvas` with a small force simulation and keeps drawing it until destroy(). */
export function makeGraph(canvas: HTMLCanvasElement, data: GraphData, opts: { labels?: boolean } = {}): Graph {
  const ctx = canvas.getContext('2d')!;
  const nodes: SimNode[] = data.nodes.map((n, i) => ({ ...n, x: Math.cos(i * 2.4) * 90, y: Math.sin(i * 2.4) * 70, vx: 0, vy: 0 }));
  const byId = new Map<string, SimNode>(nodes.map((n) => [n.id, n]));
  const links: SimLink[] = data.links.map(([a, b]) => ({ a: byId.get(a)!, b: byId.get(b)! }));
  let w = 0, hh = 0, raf = 0, drag: SimNode | null = null, hover: SimNode | null = null, emph = new Set<string>(), labels = opts.labels !== false;
  function fit() { const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1; w = r.width; hh = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function step() {
    for (const a of nodes) for (const b of nodes) {
      if (a === b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 1, d = Math.sqrt(d2), f = 2600 / d2;
      a.vx -= f * dx / d; a.vy -= f * dy / d;
    }
    for (const { a, b } of links) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 95) * 0.025;
      a.vx += f * dx / d; a.vy += f * dy / d; b.vx -= f * dx / d; b.vy -= f * dy / d;
    }
    for (const n of nodes) {
      if (n === drag) { n.vx = n.vy = 0; continue; }
      n.vx -= n.x * 0.012; n.vy -= n.y * 0.012; n.vx *= 0.82; n.vy *= 0.82; n.x += n.vx; n.y += n.vy;
    }
  }
  function draw() {
    const acc = accentOf(canvas), ink = inkOf(canvas), any = emph.size > 0;
    ctx.clearRect(0, 0, w, hh); ctx.save(); ctx.translate(w / 2, hh / 2);
    ctx.lineWidth = 1.2;
    for (const { a, b } of links) {
      const on = emph.has(a.id) && emph.has(b.id);
      ctx.strokeStyle = on ? acc : ink; ctx.globalAlpha = on ? 0.9 : (any ? 0.12 : 0.28);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const n of nodes) {
      const on = emph.has(n.id), r = 5 + (n.w || 1) * 2.2;
      ctx.globalAlpha = on || !any ? 1 : 0.3;
      ctx.fillStyle = on || n === hover ? acc : ink;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      if (labels) { ctx.font = `${on ? '600' : '400'} 12px IBM Plex Sans, sans-serif`; ctx.fillStyle = ink; ctx.globalAlpha = on || !any ? 1 : 0.45; ctx.fillText(n.label, n.x + r + 5, n.y + 4); }
    }
    ctx.restore();
  }
  function loop() { step(); draw(); raf = requestAnimationFrame(loop); }
  const at = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(), x = e.clientX - r.left - w / 2, y = e.clientY - r.top - hh / 2; return nodes.find((n) => Math.hypot(n.x - x, n.y - y) < 14) || null; };
  const onDown = (e: PointerEvent) => { drag = at(e); if (drag) { canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; } };
  const onMove = (e: PointerEvent) => { hover = at(e); if (drag) { const r = canvas.getBoundingClientRect(); drag.x = e.clientX - r.left - w / 2; drag.y = e.clientY - r.top - hh / 2; } };
  const onUp = () => { drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  fit(); const ro = new ResizeObserver(fit); ro.observe(canvas); loop();
  return {
    nodes, links,
    setEmphasis(ids) { emph = new Set(ids); },
    setLabels(v) { labels = v; },
    shake() { for (const n of nodes) { n.vx += (Math.random() - .5) * 40; n.vy += (Math.random() - .5) * 40; } },
    add(label, toId) { const n: SimNode = { id: 'n' + nodes.length, label, w: 1, x: (Math.random() - .5) * 40, y: (Math.random() - .5) * 40, vx: 0, vy: 0 }; nodes.push(n); byId.set(n.id, n); const to = (toId && byId.get(toId)) || nodes[Math.floor(Math.random() * (nodes.length - 1))]; links.push({ a: n, b: to }); return n; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
  };
}

/** Global workspace theory as a concept graph; the dataset every graph demo and composition shares. */
export const CONCEPTS: GraphData = {
  nodes: [
    { id: 'gw', label: 'global workspace', w: 3 }, { id: 'att', label: 'attention', w: 2 }, { id: 'bc', label: 'broadcast', w: 2 },
    { id: 'mod', label: 'specialist modules', w: 2 }, { id: 'comp', label: 'competition', w: 1 }, { id: 'wm', label: 'working memory', w: 2 },
    { id: 'cons', label: 'conscious access', w: 2 }, { id: 'ign', label: 'ignition', w: 1 }, { id: 'rep', label: 'report', w: 1 },
    { id: 'unc', label: 'unconscious processing', w: 1 }, { id: 'ai', label: 'AI architectures', w: 1 }, { id: 'sal', label: 'salience', w: 1 },
  ],
  links: [['gw', 'bc'], ['gw', 'att'], ['gw', 'mod'], ['mod', 'comp'], ['comp', 'att'], ['bc', 'cons'], ['cons', 'rep'], ['gw', 'wm'], ['ign', 'cons'], ['ign', 'bc'], ['unc', 'mod'], ['ai', 'gw'], ['sal', 'att'], ['sal', 'comp']],
};

// ---------- the demo: data-driven node-link graph ----------

let g: Graph | null = null;
let status: HTMLElement, canvas: HTMLCanvasElement;

const demo: Demo = {
  mount(root) {
    canvas = h('canvas', { class: 'graph', style: 'height:340px', 'aria-label': 'Concept graph' });
    status = h('div', { class: 'status' });
    const labelsBtn = h('button', { class: 'btn small', 'aria-pressed': 'true', onclick: () => { const v = labelsBtn.getAttribute('aria-pressed') !== 'true'; labelsBtn.setAttribute('aria-pressed', String(v)); g?.setLabels(v); } }, 'Labels');
    const update = () => { if (g) status.textContent = `Force simulation on a 2D canvas · ${g.nodes.length} nodes, ${g.links.length} links · drag a node, hover to highlight`; };
    root.append(h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => { g?.add(['revision', 'feedback', 'threshold', 'binding', 'prediction'][g.nodes.length % 5]); update(); } }, 'Add a concept'),
      h('button', { class: 'btn', onclick: () => g?.shake() }, 'Shake'),
      h('button', { class: 'btn', onclick: () => g?.setEmphasis(g.nodes.filter((n) => n.w > 1).map((n) => n.id)) }, 'Emphasize core'),
      h('button', { class: 'btn', onclick: () => g?.setEmphasis([]) }, 'Clear'),
      labelsBtn), h('div', { class: 'frame' }, canvas), status);
    g = makeGraph(canvas, CONCEPTS); update();
  },
  unmount() { g?.destroy(); g = null; },
};

export default demo;
