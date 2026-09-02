// Audio as a medium: microphone capture with a live waveform, MediaRecorder recording, and decode-and-play playback.
// Framework-free. mount(root) builds the UI; unmount() releases the microphone, stops the oscillator, and closes the AudioContext.

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

/** The lane's accent, read from the CSS custom property the site sets on the stage. */
const accentOf = (el: Element) => getComputedStyle(el).getPropertyValue('--accent').trim() || '#D9573F';

type Mode = 'idle' | 'live' | 'tone' | 'recording' | 'playback';

let root: HTMLElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, status: HTMLElement;
let ac: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mic: MediaStream | null = null;
let osc: OscillatorNode | null = null;
let lfo: OscillatorNode | null = null;
let rec: MediaRecorder | null = null;
let chunks: Blob[] = [];
let playing: AudioBufferSourceNode | null = null;
let recorded: AudioBuffer | null = null;
let raf = 0;
let mode: Mode = 'idle';
const btns: Record<string, HTMLButtonElement> = {};

/** Create the AudioContext lazily, inside a user gesture, and resume it if the browser suspended it. */
function ensureCtx(): AudioContext {
  if (!ac) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    ac = new Ctx();
    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function draw() {
  const w = canvas.width, hh = canvas.height;
  ctx.clearRect(0, 0, w, hh);
  ctx.lineWidth = 2;
  ctx.strokeStyle = accentOf(root);
  ctx.beginPath();
  if (analyser && mode !== 'idle') {
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    for (let i = 0; i < buf.length; i++) {
      const x = i / buf.length * w, y = buf[i] / 255 * hh;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
  } else {
    for (let x = 0; x < w; x++) {
      const y = hh / 2 + Math.sin(x / 18) * Math.sin(x / 140) * hh * 0.3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
  }
  ctx.stroke();
  if (mode === 'recording') { ctx.fillStyle = '#D9573F'; ctx.beginPath(); ctx.arc(18, 18, 6, 0, Math.PI * 2); ctx.fill(); }
  raf = requestAnimationFrame(draw);
}

function setMode(m: Mode, msg?: string, warn?: boolean) {
  mode = m;
  status.textContent = msg || '';
  status.classList.toggle('warn', !!warn);
  btns.rec.disabled = m !== 'live';
  btns.stop.disabled = m === 'idle';
  btns.play.disabled = !recorded || m === 'recording';
}

async function useMic() {
  const ctx = ensureCtx();
  stopAll();
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    ctx.createMediaStreamSource(mic).connect(analyser!);
    setMode('live', 'Microphone live. Speak, then press Record.');
  } catch (e: any) {
    setMode('idle', e?.name === 'NotAllowedError'
      ? 'Microphone blocked (by you, or by this embedded frame). The test tone still works.'
      : `Microphone unavailable: ${e?.name}. The test tone still works.`, true);
  }
}

function tone() {
  const ctx = ensureCtx();
  stopAll();
  osc = ctx.createOscillator();
  const g = ctx.createGain(); g.gain.value = 0.15;
  osc.type = 'triangle'; osc.frequency.value = 220;
  lfo = ctx.createOscillator(); lfo.frequency.value = 0.5;
  const lg = ctx.createGain(); lg.gain.value = 60;
  lfo.connect(lg).connect(osc.frequency); lfo.start();
  osc.connect(g); g.connect(analyser!); g.connect(ctx.destination); osc.start();
  setMode('tone', 'Synthesized tone through the same AnalyserNode the mic uses.');
}

function record() {
  if (!mic) return;
  chunks = [];
  const r = new MediaRecorder(mic);
  rec = r;
  r.ondataavailable = (e: any) => chunks.push(e.data);
  r.onstop = async () => {
    try {
      const buf = await new Blob(chunks, { type: r.mimeType }).arrayBuffer();
      recorded = await ac!.decodeAudioData(buf);
      setMode('live', `Recorded ${recorded.duration.toFixed(1)} s (${r.mimeType || 'default codec'}). Press Play.`);
    } catch { setMode('live', 'Could not decode the recording in this browser.', true); }
  };
  r.start();
  setMode('recording', 'Recording…');
}

function play() {
  const ctx = ensureCtx();
  if (!recorded) return;
  playing?.stop();
  playing = ctx.createBufferSource();
  playing.buffer = recorded;
  playing.connect(analyser!); playing.connect(ctx.destination); playing.start();
  setMode('playback', 'Playing back through decodeAudioData → AudioBufferSourceNode (no blob: URLs).');
  playing.onended = () => { if (mode === 'playback') setMode(mic ? 'live' : 'idle', 'Playback finished.'); };
}

/** Stop the recorder, the oscillator, any playback, and release every microphone track. */
function stopAll() {
  if (rec?.state === 'recording') rec.stop();
  osc?.stop(); lfo?.stop(); osc = null; lfo = null;
  playing?.stop(); playing = null;
  mic?.getTracks().forEach((t) => t.stop()); mic = null;
}

const demo: Demo = {
  mount(el) {
    root = el;
    canvas = h('canvas', { width: 800, height: 220, 'aria-label': 'Waveform' });
    ctx = canvas.getContext('2d')!;
    status = h('div', { class: 'status' });
    btns.mic = h('button', { class: 'btn primary', onclick: useMic }, 'Use microphone');
    btns.tone = h('button', { class: 'btn', onclick: tone }, 'Test tone');
    btns.rec = h('button', { class: 'btn', onclick: record, disabled: true }, 'Record');
    btns.stop = h('button', {
      class: 'btn', disabled: true,
      onclick: () => { if (mode === 'recording') rec?.stop(); else { stopAll(); setMode('idle', 'Stopped. Tracks released, oscillator stopped.'); } },
    }, 'Stop');
    btns.play = h('button', { class: 'btn', onclick: play, disabled: true }, 'Play recording');
    root.append(h('div', { class: 'row' }, btns.mic, btns.tone, btns.rec, btns.stop, btns.play), h('div', { class: 'frame' }, canvas), status);
    setMode('idle', 'Idle. Nothing is captured until you press a button — audio needs a user gesture.');
    cancelAnimationFrame(raf);
    draw();
  },
  unmount() {
    cancelAnimationFrame(raf);
    stopAll();
    recorded = null;
    if (ac) { ac.close().catch(() => {}); ac = null; analyser = null; }
  },
};

export default demo;
