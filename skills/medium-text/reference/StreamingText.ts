// Text as a medium: a streamed answer rendered as markdown while it is still being written.
// Framework-free. mount(root) builds the UI; unmount() stops the stream.

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
export function renderMd(md: string): string {
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
  'Explain streaming to a PM': `## Why we stream text\nPeople read at about **250 words a minute**, but a model can take 3–8 seconds to finish a paragraph. If we wait for the whole answer, the screen is blank for all of that time.\n\nStreaming shows each token as it arrives, so:\n- the first word lands in ~300 ms instead of ~5 s\n- people start reading while we keep generating\n- a wrong direction is visible early, and a \`Stop\` button becomes meaningful\n\nThe cost is UI complexity: markdown that is half-written, code fences that are still open, and layout that shifts as text grows. The reference component handles all three.`,
  'Write release notes': `# v0.4 — Medium Pool\n\n## New\n- **Seven mediums** in one place, plus kinds and compositions\n- Every demo doubles as the skill's reference code\n\n## Changed\n- Install line is now \`npx skills add funclosure/medium-pool\`\n- Skill tab renders the raw \`SKILL.md\` so nothing is hidden\n\n## Fixed\n- Camera and microphone are released the moment you leave the lane`,
  'Summarize this page': `**Medium Pool** is a kickstart guide. Each lane is one medium an app can use, with a working demo you can touch and an Agent Skill you can install.\n\n- Try the medium in the browser\n- Read why it matters and where it bites\n- Copy the skill into your repo\n\nYour coding agent reads the skill and builds that medium the way the demo does.`,
};

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let out: HTMLElement, input: HTMLInputElement, meter: HTMLElement, stopBtn: HTMLButtonElement;
let timer: ReturnType<typeof setInterval> | undefined;
let streaming = false;

function stop() {
  streaming = false;
  clearInterval(timer);
  stopBtn.disabled = true;
  out.querySelector('.caret')?.remove();
}

function stream(prompt: string) {
  const text = answers[prompt] || `I don't have a canned answer for “${prompt}” in this demo, but the real thing would stream one here.\n\nTry one of the prompts above to see **markdown rendered mid-stream**.`;
  const tokens = text.match(/\S+\s*|\s+/g) || [];
  let i = 0, acc = '';
  const t0 = performance.now();
  clearInterval(timer);
  streaming = true;
  stopBtn.disabled = false;
  out.innerHTML = '';
  timer = setInterval(() => {
    if (!streaming) return;
    acc += tokens[i++];
    const done = i >= tokens.length;
    out.innerHTML = renderMd(acc) + (done ? '' : '<span class="caret" aria-hidden="true"></span>');
    out.scrollTop = out.scrollHeight;
    meter.textContent = `${i} tokens · ${Math.round(performance.now() - t0)} ms · ${done ? 'done' : 'streaming'}`;
    if (done) stop();
  }, reduceMotion() ? 8 : 38);
}

const demo: Demo = {
  mount(root) {
    out = h('div', { class: 'out md', 'aria-live': 'polite' });
    meter = h('div', { class: 'meter' }, '0 tokens');
    stopBtn = h('button', { class: 'btn small', disabled: true, onclick: stop }, 'Stop');
    input = h('input', { type: 'text', placeholder: 'Ask anything, or pick a prompt', 'aria-label': 'Prompt' });
    const form = h('form', { class: 'ask', onsubmit: (e: Event) => { e.preventDefault(); if (input.value.trim()) stream(input.value.trim()); } },
      input, h('button', { class: 'btn primary', type: 'submit' }, 'Send'));
    const chips = h('div', { class: 'chips' }, Object.keys(answers).map((p) =>
      h('button', { class: 'chip', type: 'button', onclick: () => { input.value = p; stream(p); } }, p)));
    root.append(chips, form, out, h('div', { class: 'row', style: 'justify-content:space-between' }, meter, stopBtn));
    stream('Explain streaming to a PM');
  },
  unmount() { streaming = false; clearInterval(timer); },
};

export default demo;
