// Copy buttons: data-copy="#selector" copies that element's text, data-copy-text copies a literal.
async function copyText(text: string, btn: HTMLButtonElement) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const ta = document.createElement('textarea');
    ta.style.cssText = 'position:fixed;opacity:0';
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch { /* fall through */ }
    ta.remove();
  }
  const label = btn.textContent;
  btn.textContent = ok ? 'Copied' : 'Select and copy manually';
  btn.classList.toggle('copied', ok);
  setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 1600);
}

document.querySelectorAll<HTMLButtonElement>('[data-copy],[data-copy-text]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sel = btn.dataset.copy;
    const text = sel ? document.querySelector(sel)?.textContent ?? '' : btn.dataset.copyText ?? '';
    copyText(text, btn);
  });
});
