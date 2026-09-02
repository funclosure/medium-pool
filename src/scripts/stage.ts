// Mounts the pool instance named by the page's stage, and swaps instances when a class has more than one.
// The module it mounts is the same file an agent reads from SKILL.md.
export interface Demo { mount(root: HTMLElement): void; unmount(): void }

const modules = import.meta.glob<{ default: Demo }>('/skills/*/reference/*.ts');

const root = document.querySelector<HTMLElement>('[data-demo]');
let current: Demo | null = null;

async function mount(key: string) {
  if (!root) return;
  current?.unmount();
  current = null;
  root.replaceChildren();
  const load = modules[key];
  if (!load) { root.textContent = `No module at ${key}. Check the instance's module field.`; return; }
  try {
    const m = await load();
    current = m.default;
    current.mount(root);
  } catch (err: any) {
    root.textContent = `The instance failed to load: ${err?.message ?? err}`;
  }
}

if (root) {
  mount(root.dataset.demo!);
  addEventListener('pagehide', () => current?.unmount(), { once: true });

  document.querySelectorAll<HTMLButtonElement>('.instswitch button').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.instswitch button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const name = document.getElementById('instance-name'); if (name) name.textContent = btn.dataset.name ?? '';
    const hook = document.getElementById('instance-hook'); if (hook) hook.textContent = btn.dataset.hook ?? '';
    mount(btn.dataset.demoKey!);
  }));
}
