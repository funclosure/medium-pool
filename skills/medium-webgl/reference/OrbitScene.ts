// 3D as a medium: a lit torus knot you can orbit, with three.js and one renderer for the life of the page.
// Framework-free apart from three (imported from npm, pinned in package.json).
// mount(root) attaches the shared renderer's canvas; unmount() stops the loop and detaches it without disposing.

import * as THREE from 'three';

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

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type MatKind = 'matte' | 'metal' | 'normals';
type Mat = THREE.MeshStandardMaterial | THREE.MeshNormalMaterial;

// One renderer, scene, and mesh for the life of the page; browsers cap live WebGL contexts.
let renderer: THREE.WebGLRenderer | undefined, scene: THREE.Scene, camera: THREE.PerspectiveCamera, mesh: THREE.Mesh<THREE.TorusKnotGeometry, Mat>;
let raf = 0, wrap: HTMLElement, ro: ResizeObserver | undefined, status: HTMLElement;
let theta = 0.6, phi = 1.1, dist = 4.2, auto = true, seeded = false, dragging = false, last = { x: 0, y: 0 }, wire = false, matKind: MatKind = 'matte';

const mats = (): Record<MatKind, Mat> => ({
  matte: new THREE.MeshStandardMaterial({ color: 0x1794b0, roughness: 0.85, metalness: 0.05 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.25, metalness: 0.9 }),
  normals: new THREE.MeshNormalMaterial(),
});

/** Creates the shared renderer and scene on first use. Returns false when WebGL is unavailable, leaving nothing behind so a later mount can retry. */
function ensure(): boolean {
  if (renderer) return true;
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223333, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(3, 4, 5); scene.add(key);
    mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.3, 180, 24), mats().matte);
    scene.add(mesh);
    renderer = r;
    return true;
  } catch { return false; }
}
function place() {
  camera.position.set(dist * Math.sin(phi) * Math.sin(theta), dist * Math.cos(phi), dist * Math.sin(phi) * Math.cos(theta));
  camera.lookAt(0, 0, 0);
}
function size() {
  if (!renderer) return;
  const w = wrap.clientWidth, hh = Math.max(280, Math.round(w * 0.6));
  renderer.setSize(w, hh, false); renderer.domElement.style.height = hh + 'px';
  camera.aspect = w / hh; camera.updateProjectionMatrix();
}
function loop() {
  if (!renderer) return;
  if (auto && !dragging) theta += 0.006;
  place(); renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);
}
function setMat() { mesh.material.dispose(); mesh.material = mats()[matKind]; mesh.material.wireframe = wire; }

const demo: Demo = {
  mount(root) {
    if (!seeded) { seeded = true; auto = !reduceMotion(); }
    wrap = h('div', { class: 'frame', style: 'cursor:grab' });
    status = h('div', { class: 'status' });
    if (!ensure() || !renderer) { wrap.append(h('div', { style: 'padding:40px;text-align:center' }, 'WebGL is unavailable in this browser, so there is nothing to render. The rest of the page still works.')); root.append(wrap); return; }
    wrap.append(renderer.domElement);
    const onDown = (e: PointerEvent) => { dragging = true; last = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); wrap.style.cursor = 'grabbing'; };
    const onMove = (e: PointerEvent) => { if (!dragging) return; theta -= (e.clientX - last.x) * 0.008; phi = Math.min(2.9, Math.max(0.25, phi - (e.clientY - last.y) * 0.008)); last = { x: e.clientX, y: e.clientY }; };
    const onUp = () => { dragging = false; wrap.style.cursor = 'grab'; };
    wrap.addEventListener('pointerdown', onDown); wrap.addEventListener('pointermove', onMove); wrap.addEventListener('pointerup', onUp); wrap.addEventListener('pointercancel', onUp);
    wrap.style.touchAction = 'none';
    const kinds: MatKind[] = ['matte', 'metal', 'normals'];
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Material' }, kinds.map((m) => h('button', { 'aria-pressed': m === matKind, onclick: (e: MouseEvent) => { matKind = m; seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); setMat(); } }, m[0].toUpperCase() + m.slice(1))));
    const wireBtn = h('button', { class: 'btn small', 'aria-pressed': wire, onclick: () => { wire = !wire; mesh.material.wireframe = wire; wireBtn.setAttribute('aria-pressed', String(wire)); } }, 'Wireframe');
    const autoBtn = h('button', { class: 'btn small', 'aria-pressed': auto, onclick: () => { auto = !auto; autoBtn.setAttribute('aria-pressed', String(auto)); } }, 'Auto-rotate');
    root.append(h('div', { class: 'row' }, seg, wireBtn, autoBtn), wrap, status);
    status.textContent = `Drag to orbit · three.js r${THREE.REVISION} · one WebGLRenderer reused across visits so the browser never runs out of contexts`;
    size(); ro = new ResizeObserver(size); ro.observe(wrap);
    cancelAnimationFrame(raf); loop();
  },
  unmount() { cancelAnimationFrame(raf); ro?.disconnect(); ro = undefined; dragging = false; renderer?.domElement.remove(); },
};

export default demo;
