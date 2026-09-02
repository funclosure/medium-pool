// Video as a medium: a <video> element fed by any MediaStream. A generated canvas feed is the at-rest source;
// the camera is opt-in with a graceful denial path. Framework-free. mount(root) builds the UI; unmount() stops every track.

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

const FILTERS: [string, string][] = [
  ['none', 'No filter'],
  ['grayscale(1)', 'Grayscale'],
  ['sepia(.8)', 'Sepia'],
  ['invert(1)', 'Invert'],
  ['contrast(1.8) saturate(1.6)', 'Punchy'],
];

let root: HTMLElement, video: HTMLVideoElement, gen: HTMLCanvasElement, gctx: CanvasRenderingContext2D;
let status: HTMLElement, snaps: HTMLElement;
let stream: MediaStream | null = null; // canvas.captureStream() output
let cam: MediaStream | null = null;    // camera tracks
let raf = 0;
let filter = 'none';
let t0 = 0;

/** Paint one frame of the generated feed: drifting color blobs, scanlines, a clock. */
function drawGen() {
  const t = (performance.now() - t0) / 1000, w = gen.width, hh = gen.height;
  gctx.fillStyle = '#0f1f24'; gctx.fillRect(0, 0, w, hh);
  for (let i = 0; i < 5; i++) {
    const x = w / 2 + Math.cos(t * 0.5 + i * 1.3) * w * 0.32, y = hh / 2 + Math.sin(t * 0.7 + i * 0.9) * hh * 0.3;
    const g = gctx.createRadialGradient(x, y, 0, x, y, 120);
    g.addColorStop(0, ['#7a4fd1', '#1794b0', '#d9573f', '#248f63', '#c98a18'][i]); g.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = g; gctx.globalAlpha = 0.85; gctx.fillRect(0, 0, w, hh);
  }
  gctx.globalAlpha = 1;
  gctx.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < hh; y += 4) gctx.fillRect(0, y, w, 1);
  gctx.fillStyle = '#fff'; gctx.font = '600 16px IBM Plex Mono, monospace';
  gctx.fillText('GENERATED FEED', 16, 28); gctx.fillText(new Date().toLocaleTimeString(), w - 130, 28);
  raf = requestAnimationFrame(drawGen);
}

function stopGenerated() { stream?.getTracks().forEach((t) => t.stop()); stream = null; }
function stopCam() { cam?.getTracks().forEach((t) => t.stop()); cam = null; }

function useGenerated() {
  stopCam();
  stopGenerated();
  cancelAnimationFrame(raf); t0 = performance.now(); drawGen();
  stream = typeof (gen as any).captureStream === 'function' ? gen.captureStream(30) : null;
  if (stream) {
    video.srcObject = stream; video.play().catch(() => {});
    status.textContent = 'Source: canvas.captureStream() → <video>. No permission needed, so this is the at-rest state.';
  } else {
    status.textContent = 'This browser cannot turn a canvas into a stream. Try the camera.';
  }
}

async function useCamera() {
  status.classList.remove('warn');
  try {
    cam = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
    cancelAnimationFrame(raf); video.srcObject = cam; video.play().catch(() => {});
    status.textContent = 'Source: camera. Stopping tracks on leave releases the recording indicator.';
  } catch (e: any) {
    status.classList.add('warn');
    status.textContent = e?.name === 'NotAllowedError'
      ? 'Camera blocked (by you, or by this embedded frame). The generated feed stays on.'
      : `Camera unavailable: ${e?.name}. The generated feed stays on.`;
  }
}

/** Grab the current frame, with the active CSS filter baked in, into a thumbnail strip of the last four. */
function snapshot() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 90;
  const cx = c.getContext('2d')!; cx.filter = filter; cx.drawImage(video, 0, 0, 160, 90);
  snaps.prepend(c);
  while (snaps.children.length > 4) snaps.lastChild?.remove();
}

const demo: Demo = {
  mount(el) {
    root = el;
    video = h('video', { autoplay: true, muted: true, playsinline: true, 'aria-label': 'Live video' });
    video.muted = true; // the property, not just the attribute, or autoplay is refused
    gen = document.createElement('canvas'); gen.width = 640; gen.height = 360; gctx = gen.getContext('2d')!;
    status = h('div', { class: 'status' });
    snaps = h('div', { class: 'snaps', 'aria-label': 'Snapshots' });
    const sel = h('select', { 'aria-label': 'Filter', onchange: (e: any) => { filter = e.target.value; video.style.filter = filter; } },
      FILTERS.map(([v, l]) => h('option', { value: v }, l)));
    const camBtn = h('button', { class: 'btn primary', onclick: useCamera }, 'Use camera');
    root.append(
      h('div', { class: 'row' }, camBtn, h('button', { class: 'btn', onclick: useGenerated }, 'Generated feed'), sel, h('button', { class: 'btn', onclick: snapshot }, 'Snapshot')),
      h('div', { class: 'frame' }, video),
      snaps,
      status,
    );
    useGenerated();
  },
  unmount() {
    cancelAnimationFrame(raf);
    stopCam();
    stopGenerated();
    if (video) video.srcObject = null;
  },
};

export default demo;
