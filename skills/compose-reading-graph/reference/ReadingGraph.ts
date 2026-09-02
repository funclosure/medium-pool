// Reading-driven graph: prose and a concept graph bound by scroll position.
// A reading line 40% down the pane picks one active passage; its concept ids become the graph's emphasis set.
// Framework-free. mount(root) builds the UI; unmount() stops auto-read and destroys the graph.

import { makeGraph, CONCEPTS } from '../../medium-visualization/reference/ForceGraph';
import type { Graph } from '../../medium-visualization/reference/ForceGraph';

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

/** Each passage declares the concept ids it is about. The graph never parses prose. */
const passages: { ids: string[]; html: string }[] = [
  { ids: ['gw', 'mod'], html: 'Global workspace theory starts from a crowd. The mind is a <mark>global workspace</mark> shared by many <mark>specialist modules</mark>, each good at one thing and mostly silent.' },
  { ids: ['comp', 'att', 'sal'], html: 'The modules do not take turns politely. They enter a <mark>competition</mark>, and <mark>attention</mark> is the referee, weighing <mark>salience</mark> to decide which coalition wins.' },
  { ids: ['bc', 'ign', 'cons'], html: 'The winner is <mark>broadcast</mark> to everyone at once. That sudden, self-reinforcing <mark>ignition</mark> is what the theory calls <mark>conscious access</mark>.' },
  { ids: ['wm', 'rep', 'cons'], html: 'Once broadcast, content is held in <mark>working memory</mark> long enough to be used, combined, and turned into a <mark>report</mark>, which is the only evidence of <mark>conscious access</mark> we ever get from the outside.' },
  { ids: ['unc', 'mod'], html: 'Everything the losing coalitions did still happened. <mark>Unconscious processing</mark> is not a smaller mind, it is the same <mark>specialist modules</mark> working without the microphone.' },
  { ids: ['ai', 'gw', 'bc'], html: 'This is why <mark>AI architectures</mark> keep rediscovering the shape: many narrow experts, one shared <mark>global workspace</mark>, and a <mark>broadcast</mark> step that makes the winner available to all.' },
];

let g: Graph | null = null;
let reader: HTMLElement, status: HTMLElement;
let auto = false;
let autoRaf: number | undefined;

/** Resolve scroll to the one passage nearest a fixed reading line, 40% down the pane. */
function sync() {
  const mid = reader.scrollTop + reader.clientHeight * 0.4;
  const all = [...reader.querySelectorAll<HTMLParagraphElement>('p[data-ids]')];
  let best: HTMLParagraphElement | null = null, bd = Infinity;
  for (const p of all) {
    const d = Math.abs(p.offsetTop + p.offsetHeight / 2 - mid);
    if (d < bd) { bd = d; best = p; }
  }
  all.forEach((p) => p.toggleAttribute('data-on', p === best));
  const ids = best ? (best.dataset.ids || '').split(',') : [];
  g?.setEmphasis(ids);
  status.textContent = best
    ? `Scroll position → passage ${all.indexOf(best) + 1} of ${passages.length} → emphasis set {${best.dataset.ids}}`
    : 'Scroll the prose; the graph follows.';
}

function tick() {
  if (!auto) return;
  reader.scrollTop += 0.6;
  if (reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 1) auto = false;
  autoRaf = requestAnimationFrame(tick);
}

const demo: Demo = {
  mount(root) {
    reader = h('div', { class: 'reader frame', 'aria-label': 'Source text' },
      h('div', { class: 'pad' }),
      passages.map((p) => h('p', { 'data-ids': p.ids.join(','), html: p.html })),
      h('div', { class: 'pad' }));
    reader.style.scrollBehavior = 'auto';
    const canvas = h('canvas', { class: 'graph', 'aria-label': 'Concept graph following the text' });
    status = h('div', { class: 'status' });
    const autoBtn = h('button', { class: 'btn primary', 'aria-pressed': 'false', onclick: () => {
      auto = !auto;
      autoBtn.setAttribute('aria-pressed', String(auto));
      if (auto) tick();
    } }, 'Read for me');
    const topBtn = h('button', { class: 'btn', onclick: () => {
      auto = false;
      autoBtn.setAttribute('aria-pressed', 'false');
      reader.scrollTop = 0;
    } }, 'Back to top');
    root.append(
      h('div', { class: 'row' }, autoBtn, topBtn),
      h('div', { class: 'compose' }, reader, h('div', { class: 'frame' }, canvas)),
      status);
    g = makeGraph(canvas, CONCEPTS, { labels: true });
    reader.addEventListener('scroll', sync, { passive: true });
    sync();
  },
  unmount() {
    auto = false;
    if (autoRaf !== undefined) cancelAnimationFrame(autoRaf);
    g?.destroy();
    g = null;
  },
};

export default demo;
