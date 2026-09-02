// Ask-driven graph: a streamed answer and a concept graph bound by the answer stream.
// Each tick renders the answer so far as markdown and grows the graph's emphasis set by label match.
// Framework-free. mount(root) builds the UI; unmount() stops the stream and destroys the graph.

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

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

/** Forgiving markdown: headings, lists, **bold**, `code`, paragraphs. Renders partial input without breaking. */
function renderMd(md: string): string {
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  let out = '';
  let list: string[] | null = null;
  const flush = () => { if (list) { out += `<ul>${list.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`; list = null; } };
  for (const line of md.trim().split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.*)/);
    if (m) { flush(); out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; continue; }
    if (/^\s*-\s+/.test(line)) { (list ||= []).push(line.replace(/^\s*-\s+/, '')); continue; }
    flush();
    if (line.trim()) out += `<p>${inline(line)}</p>`;
  }
  flush();
  return out;
}

const answers: Record<string, string> = {
  'What is ignition?': `**Ignition** is the moment a coalition wins the **competition** and its content is **broadcast** across the **global workspace**. It is self-reinforcing: once enough **specialist modules** echo the signal, it locks in, and that lock-in is what the theory identifies with **conscious access**.`,
  'Why do losers still matter?': `Because **unconscious processing** is not a lesser mind. The **specialist modules** that lost the **competition** still did their work; they simply were not **broadcast**. Their results can shape **attention** and **salience** on the next cycle, which is why priming works without any **report**.`,
  'How does this map to AI?': `Modern **AI architectures** keep rediscovering the shape. Many narrow experts, a shared **global workspace**, and a **broadcast** step that makes the winner available to everyone. **Working memory** is the buffer that keeps a broadcast alive long enough to be used, and **attention** is the routing that decides what enters it.`,
};

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let g: Graph | null = null;
let out: HTMLElement, status: HTMLElement;
let timer: ReturnType<typeof setInterval> | undefined;
let streaming = false;

function stream(q: string) {
  const text = answers[q] || `No canned answer for “${q}” in this prototype. Pick a question above to watch the graph follow the answer.`;
  const tokens = text.match(/\S+\s*|\s+/g) || [];
  let i = 0, acc = '';
  clearInterval(timer);
  streaming = true;
  timer = setInterval(() => {
    acc += tokens[i++];
    out.innerHTML = renderMd(acc) + (i < tokens.length ? '<span class="caret" aria-hidden="true"></span>' : '');
    out.scrollTop = out.scrollHeight;
    // Label match is a demo shortcut; the real thing asks the model to cite ids. The set only grows within one answer.
    const low = acc.toLowerCase();
    const ids = CONCEPTS.nodes.filter((n) => low.includes(n.label.toLowerCase())).map((n) => n.id);
    g?.setEmphasis(ids);
    status.textContent = `Answer stream → ${i} tokens → emphasis set grows {${ids.join(',')}}`;
    if (i >= tokens.length) { streaming = false; clearInterval(timer); }
  }, reduceMotion() ? 8 : 55);
}

const demo: Demo = {
  mount(root) {
    out = h('div', { class: 'out md', style: 'min-height:0', 'aria-live': 'polite' });
    status = h('div', { class: 'status' });
    const canvas = h('canvas', { class: 'graph', 'aria-label': 'Concept graph following the answer' });
    const chips = h('div', { class: 'chips' }, Object.keys(answers).map((q) =>
      h('button', { class: 'chip', type: 'button', onclick: () => stream(q) }, q)));
    const left = h('div', { style: 'display:flex;flex-direction:column;gap:10px;min-height:0' }, chips, out);
    root.append(h('div', { class: 'compose' }, left, h('div', { class: 'frame' }, canvas)), status);
    g = makeGraph(canvas, CONCEPTS, { labels: true });
    stream('What is ignition?');
  },
  unmount() {
    streaming = false;
    clearInterval(timer);
    g?.destroy();
    g = null;
  },
};

export default demo;
