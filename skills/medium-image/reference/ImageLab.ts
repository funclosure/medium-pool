// Image as a medium: get a file in (drop or pick), decode it locally, and run pixel filters on ImageData.
// A generated sample image is the at-rest source, so the lab works before any file arrives.
// Framework-free. mount(root) builds the UI; unmount() drops the decoded source.

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

type Mode = 'original' | 'grayscale' | 'pixelate' | 'threshold';
type Source = { img: HTMLCanvasElement | HTMLImageElement; w: number; h: number; label: string };

const MODES: Mode[] = ['original', 'grayscale', 'pixelate', 'threshold'];

let root: HTMLElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, info: HTMLElement, seg: HTMLElement;
let source: Source | null = null;
let mode: Mode = 'original';
let cell = 10;   // pixelate block size
let level = 128; // threshold cut-off

/** A sunset painted in-page, so there is always something to filter before a file is chosen. */
function placeholder(): Source {
  const c = document.createElement('canvas'); c.width = 640; c.height = 400;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#1e3a5f'); sky.addColorStop(0.6, '#e78a5a'); sky.addColorStop(1, '#f7d6a0');
  g.fillStyle = sky; g.fillRect(0, 0, 640, 400);
  g.fillStyle = '#ffe9b3'; g.beginPath(); g.arc(470, 190, 58, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 3; i++) {
    g.fillStyle = ['#2f5e57', '#1f4640', '#15302c'][i];
    g.beginPath(); g.moveTo(0, 400);
    for (let x = 0; x <= 640; x += 8) g.lineTo(x, 300 - i * 30 + Math.sin(x / (60 + i * 25) + i) * 22 + Math.cos(x / 17) * 5);
    g.lineTo(640, 400); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 18px IBM Plex Sans, sans-serif';
  g.fillText('sample.png · 640×400 · generated in-page', 20, 32);
  return { img: c, w: 640, h: 400, label: 'sample.png (generated) · 640×400' };
}

/** Redraw the source and run the active filter over its ImageData. */
function apply() {
  if (!source) return;
  canvas.width = source.w; canvas.height = source.h;
  ctx.drawImage(source.img, 0, 0, source.w, source.h);
  if (mode === 'original') return;
  const id = ctx.getImageData(0, 0, source.w, source.h), d = id.data, w = source.w, hh = source.h;
  if (mode === 'grayscale') {
    for (let i = 0; i < d.length; i += 4) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = y;
    }
  } else if (mode === 'threshold') {
    for (let i = 0; i < d.length; i += 4) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const v = y > level ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  } else if (mode === 'pixelate') {
    for (let y = 0; y < hh; y += cell) for (let x = 0; x < w; x += cell) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y; yy < Math.min(y + cell, hh); yy++) for (let xx = x; xx < Math.min(x + cell, w); xx++) {
        const i = (yy * w + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      r /= n; g /= n; b /= n;
      for (let yy = y; yy < Math.min(y + cell, hh); yy++) for (let xx = x; xx < Math.min(x + cell, w); xx++) {
        const i = (yy * w + xx) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b;
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

/** Decode a dropped or picked file as a data URL (no blob: URLs), downscaling wide images before pixel work. */
function load(file: File | undefined) {
  if (!file || !file.type.startsWith('image/')) {
    info.textContent = 'That is not an image file. Try a PNG, JPEG, or WebP.';
    info.classList.add('warn');
    return;
  }
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / img.width);
      source = {
        img,
        w: Math.round(img.width * scale),
        h: Math.round(img.height * scale),
        label: `${file.name} · ${img.width}×${img.height} · ${(file.size / 1024).toFixed(0)} KB${scale < 1 ? ' · downscaled for the demo' : ''}`,
      };
      info.classList.remove('warn'); info.textContent = source.label; apply();
    };
    img.src = rd.result as string;
  };
  rd.readAsDataURL(file);
}

function setMode(m: Mode) {
  mode = m;
  seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
  apply();
}

const demo: Demo = {
  mount(el) {
    root = el; source = placeholder(); mode = 'original';
    canvas = h('canvas', { 'aria-label': 'Processed image' });
    ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filter' }, MODES.map((m) =>
      h('button', { 'data-m': m, 'aria-pressed': m === mode, onclick: () => setMode(m) }, m[0].toUpperCase() + m.slice(1))));
    const cellR = h('input', { type: 'range', min: 2, max: 40, value: cell, oninput: (e: any) => { cell = +e.target.value; if (mode === 'pixelate') apply(); } });
    const lvlR = h('input', { type: 'range', min: 0, max: 255, value: level, oninput: (e: any) => { level = +e.target.value; if (mode === 'threshold') apply(); } });
    const fileIn = h('input', { type: 'file', accept: 'image/*', id: 'img-file', onchange: (e: any) => load(e.target.files[0]) });
    const drop = h('div', { class: 'drop' },
      h('span', {}, 'Drop an image here, or ', h('label', { for: 'img-file' }, 'choose a file'), '. It never leaves your browser.'),
      fileIn);
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); load(e.dataTransfer?.files[0]); });
    info = h('div', { class: 'status' }, source.label);
    root.append(
      h('div', { class: 'row' }, seg, h('label', { class: 'field' }, 'Cell', cellR), h('label', { class: 'field' }, 'Level', lvlR)),
      h('div', { class: 'frame' }, canvas),
      drop,
      info,
    );
    apply();
  },
  unmount() { source = null; },
};

export default demo;
