// Living tile previews on the index. One shared rAF loop; a single static frame under reduced motion.
// A lane without a drawer of its own gets the default, so a new folder never breaks the loop.
type Draw = (c: CanvasRenderingContext2D, t: number, acc: string, ink: string) => void;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

const draw: Record<string, Draw> = {
  text(c, t, acc, ink) {
    const word = 'Every medium your app could speak.';
    const n = Math.floor((t * 12) % (word.length + 12));
    c.font = '500 14px IBM Plex Mono, monospace'; c.fillStyle = ink; c.fillText(word.slice(0, n), 12, 42);
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = acc; c.fillRect(12 + c.measureText(word.slice(0, n)).width + 2, 30, 7, 15); }
  },
  audio(c, t, acc) {
    const w = c.canvas.clientWidth, n = 28; c.fillStyle = acc;
    for (let i = 0; i < n; i++) { const hh = 8 + Math.abs(Math.sin(t * 3 + i * 0.5) * Math.sin(t * 0.7 + i * 0.2)) * 46; c.fillRect(8 + i * (w - 16) / n, 36 - hh / 2, (w - 16) / n * 0.55, hh); }
  },
  video(c, t, acc, ink) {
    const w = c.canvas.clientWidth; c.fillStyle = acc; c.globalAlpha = 0.18; c.fillRect(0, 0, w, 72);
    c.globalAlpha = 0.5; const y = (t * 40) % 90 - 10; const g = c.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, acc); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, y - 12, w, 24);
    c.globalAlpha = 0.25; c.fillStyle = ink; for (let yy = 0; yy < 72; yy += 3) c.fillRect(0, yy, w, 1);
    c.globalAlpha = 1; if (Math.floor(t * 1.5) % 2 === 0) { c.fillStyle = '#D9573F'; c.beginPath(); c.arc(16, 16, 4, 0, 7); c.fill(); }
  },
  image(c, t, acc) {
    const w = c.canvas.clientWidth; c.fillStyle = acc;
    for (let y = 8; y < 72; y += 10) for (let x = 8; x < w; x += 10) { const r = 1 + 3.5 * (0.5 + 0.5 * Math.sin(x / 22 + t) * Math.cos(y / 14 - t * 0.8)); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  },
  drawing(c, t, acc) {
    const w = c.canvas.clientWidth, cycle = 4, u = (t % cycle) / cycle, steps = Math.floor(u * 140);
    c.strokeStyle = acc; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i <= steps; i++) { const a = i / 140 * Math.PI * 2; const x = w / 2 + Math.sin(a * 3) * (w / 2 - 14), y = 36 + Math.sin(a * 2) * 24; c.lineWidth = 2 + Math.sin(a * 5) * 1.5; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  },
  visualization(c, t, acc, ink) {
    const w = c.canvas.clientWidth, cx = w / 2, cy = 36;
    const P = [0, 1, 2, 3, 4, 5, 6].map(i => [cx + Math.cos(t * 0.4 + i * 0.9) * (w * 0.32) * (0.6 + 0.4 * Math.sin(i)), cy + Math.sin(t * 0.55 + i * 1.3) * 24] as [number, number]);
    c.strokeStyle = ink; c.globalAlpha = 0.3; c.lineWidth = 1; c.beginPath();
    for (let i = 1; i < P.length; i++) { c.moveTo(...P[0]); c.lineTo(...P[i]); } c.moveTo(...P[2]); c.lineTo(...P[5]); c.stroke();
    c.globalAlpha = 1; const lit = Math.floor(t * 0.7) % P.length;
    P.forEach((p, i) => { c.fillStyle = i === lit || i === 0 ? acc : ink; c.beginPath(); c.arc(p[0], p[1], i === 0 ? 6 : 3.5, 0, 7); c.fill(); });
  },
  webgl(c, t, acc) {
    const w = c.canvas.clientWidth, cx = w / 2, cy = 36, s = 22, a = t * 0.8, b = t * 0.5;
    const P: [number, number][] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      let X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a), Y = y;
      const Y2 = Y * Math.cos(b) - Z * Math.sin(b); Z = Y * Math.sin(b) + Z * Math.cos(b); Y = Y2;
      const d = 1 / (3.2 - Z); P.push([cx + X * s * d * 3, cy + Y * s * d * 3]);
    }
    c.strokeStyle = acc; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const diff = (i ^ j); if (diff === 1 || diff === 2 || diff === 4) { c.moveTo(...P[i]); c.lineTo(...P[j]); } }
    c.stroke();
  },
  'reading-graph'(c, t, acc, ink) {
    const w = c.canvas.clientWidth, half = w * 0.42, lineH = 9, off = (t * 12) % (lineH * 4);
    c.fillStyle = ink; c.globalAlpha = 0.25;
    for (let i = -1; i < 8; i++) { const y = 8 + i * lineH - off; if (y < 4 || y > 60) continue; c.fillRect(12, y, half - 24 - (i % 3) * 14, 3); }
    c.globalAlpha = 1; c.fillStyle = acc; c.fillRect(12, 30, half - 40, 3);
    miniGraph(c, half + (w - half) / 2, 32, acc, ink, Math.floor(t * 0.75) % 6, false);
  },
  'ask-graph'(c, t, acc, ink) {
    const w = c.canvas.clientWidth, half = w * 0.42, word = 'What is ignition?', n = Math.floor((t * 10) % (word.length + 10));
    c.font = '500 12px IBM Plex Mono, monospace'; c.fillStyle = ink; c.fillText(word.slice(0, n), 12, 22);
    c.globalAlpha = 0.25; for (let i = 0; i < 4; i++) c.fillRect(12, 34 + i * 8, Math.min(half - 30, Math.max(0, (t * 60 - i * 40) % 260)), 3);
    c.globalAlpha = 1;
    miniGraph(c, half + (w - half) / 2, 32, acc, ink, Math.floor((t * 1.2) % 8), true);
  },
};

function miniGraph(c: CanvasRenderingContext2D, cx: number, cy: number, acc: string, ink: string, k: number, cumulative: boolean) {
  const N = 6;
  c.strokeStyle = ink; c.globalAlpha = 0.3; c.beginPath();
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 20); } c.stroke();
  c.globalAlpha = 1;
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, on = cumulative ? i < k : i === k; c.fillStyle = on ? acc : ink; c.beginPath(); c.arc(cx + Math.cos(a) * 24, cy + Math.sin(a) * 20, on ? 4.5 : 3, 0, 7); c.fill(); }
  c.fillStyle = acc; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
}

const fallback: Draw = (c, t, acc) => {
  const w = c.canvas.clientWidth; c.fillStyle = acc;
  for (let x = 10; x < w; x += 14) { const hh = 6 + Math.abs(Math.sin(t + x / 30)) * 30; c.fillRect(x, 36 - hh / 2, 6, hh); }
};

const tiles = [...document.querySelectorAll<HTMLCanvasElement>('canvas[data-preview]')].map((canvas) => ({
  canvas, ctx: canvas.getContext('2d')!, id: canvas.dataset.preview!, host: canvas.closest('.tile') ?? canvas,
}));

function frame(now: number) {
  const t = now / 1000;
  for (const { canvas, ctx, id, host } of tiles) {
    const dpr = devicePixelRatio || 1, cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch); ctx.globalAlpha = 1;
    (draw[id] ?? fallback)(ctx, t, cssVar(host, '--accent') || '#888', cssVar(host, '--ink') || '#222');
  }
  if (!reduceMotion) requestAnimationFrame(frame);
}
if (tiles.length) requestAnimationFrame(frame);
