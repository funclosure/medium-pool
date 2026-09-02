// Mounts the demo module named by the page's stage. The same file an agent reads from SKILL.md.
export interface Demo { mount(root: HTMLElement): void; unmount(): void }

const modules = import.meta.glob<{ default: Demo }>('/skills/*/reference/*.ts');

const root = document.querySelector<HTMLElement>('[data-demo]');
if (root) {
  const key = root.dataset.demo!;
  const load = modules[key];
  if (!load) {
    root.textContent = `No demo module at ${key}. Check the manifest's demo field.`;
  } else {
    load().then((m) => {
      const demo = m.default;
      demo.mount(root);
      addEventListener('pagehide', () => demo.unmount(), { once: true });
    }).catch((err) => {
      root.textContent = `The demo failed to load: ${err?.message ?? err}`;
    });
  }
}
