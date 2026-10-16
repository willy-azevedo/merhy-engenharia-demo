(() => {
  const toc = document.querySelector('.post-toc');
  const body = document.querySelector('.post-body');
  if (!toc || !body) return;

  const mobile = window.matchMedia('(max-width: 800px)');
  const arrangeToc = () => { toc.open = !mobile.matches; };
  arrangeToc();
  mobile.addEventListener('change', arrangeToc);

  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const headings = links.map(link => document.getElementById(link.hash.slice(1)));
  const progress = document.querySelector('.post-progress span');
  const header = document.querySelector('.site-header');
  let scheduled = false;
  let active = -1;

  function updateReading() {
    scheduled = false;
    const offset = header.getBoundingClientRect().height + 35;
    const rect = body.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight + offset);
    const value = Math.max(0, Math.min(1, (offset - rect.top) / distance));
    progress.style.transform = `scaleX(${value})`;
    let next = -1;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top <= offset + 35) next = index;
    });
    if (next !== active) {
      links.forEach((link, index) => {
        if (index === next) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      active = next;
    }
  }
  function scheduleReading() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateReading);
  }
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, { passive: true });
  window.addEventListener('load', scheduleReading);
  window.addEventListener('pageshow', scheduleReading);
  updateReading();

  const copy = document.querySelector('.post-copy');
  const status = document.querySelector('.post-copy-status');
  const fallback = document.querySelector('.post-copy-fallback');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.hash = '';
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(url.href);
      fallback.hidden = true;
      status.textContent = 'Link copiado.';
    } catch {
      fallback.hidden = false;
      const input = fallback.querySelector('input');
      input.value = url.href;
      input.focus();
      input.select();
      status.textContent = 'Copie o endereço no campo abaixo.';
    }
  });
})();
